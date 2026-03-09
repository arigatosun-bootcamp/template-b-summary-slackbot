"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { summarizeArticle, checkDuplicate } from "@/lib/api";
import { createClient } from "@/lib/supabase";
import Loading from "./Loading";

type Level = "簡単" | "普通" | "詳しく";
const VALID_LEVELS: Level[] = ["簡単", "普通", "詳しく"];

interface SlackTarget {
  id: string;
  name: string;
  webhookUrl: string;
}

function getStoredLevel(): Level {
  const stored = localStorage.getItem("defaultLevel");
  if (stored && VALID_LEVELS.includes(stored as Level)) {
    return stored as Level;
  }
  return "普通";
}

function useDefaultLevel(): Level {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => getStoredLevel(),
    () => "普通" as Level
  );
}

export default function SummaryForm() {
  const supabase = createClient();
  const router = useRouter();
  const defaultLevel = useDefaultLevel();
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const activeLevel = level ?? defaultLevel;
  const [summaryType, setSummaryType] = useState<"page" | "site">("page");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Slack投稿先
  const [slackTargets] = useState<SlackTarget[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("slackTargets") || "[]");
    } catch { return []; }
  });
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set(["default"]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDuplicateWarning(false);

    if (!url.trim()) {
      setError("URLを入力してください");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("正しいURL形式で入力してください（例: https://example.com）");
      return;
    }

    // ユーザー情報と認証トークンを取得
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || "";
    const authToken = session?.access_token || "";

    // 重複チェック（初回のみ）
    if (!duplicateWarning && userId && authToken) {
      const dup = await checkDuplicate(userId, url.trim(), authToken);
      if (dup.exists) {
        setDuplicateWarning(true);
        return;
      }
    }

    setLoading(true);
    setDuplicateWarning(false);

    try {
      // 選択されたWebhook URLを収集
      const webhookUrls: string[] = [];
      if (selectedTargets.has("default")) {
        // デフォルトはサーバー側で環境変数から取得
      }
      for (const target of slackTargets) {
        if (selectedTargets.has(target.id)) {
          webhookUrls.push(target.webhookUrl);
        }
      }

      const result = await summarizeArticle(
        {
          url: url.trim(),
          level: activeLevel,
          type: summaryType,
          user_id: userId,
          webhook_urls: selectedTargets.has("default") && webhookUrls.length === 0
            ? undefined
            : webhookUrls,
        },
        authToken
      );

      sessionStorage.setItem("summaryResult", JSON.stringify(result));
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "要約に失敗しました");
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loading />}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* 要約タイプ選択 */}
        <div style={styles.field}>
          <label style={styles.label}>要約タイプ</label>
          <div style={styles.typeGroup}>
            <button
              type="button"
              onClick={() => setSummaryType("page")}
              style={{
                ...styles.typeButton,
                ...(summaryType === "page" ? styles.typeButtonActive : {}),
              }}
              disabled={loading}
            >
              <span style={styles.typeIcon}>1</span>
              ページ要約
            </button>
            <button
              type="button"
              onClick={() => setSummaryType("site")}
              style={{
                ...styles.typeButton,
                ...(summaryType === "site" ? styles.typeButtonActive : {}),
              }}
              disabled={loading}
            >
              <span style={styles.typeIcon}>+</span>
              サイト全体要約
            </button>
          </div>
          <p style={styles.typeHint}>
            {summaryType === "page"
              ? "指定URLのページのみを要約します"
              : "サイト内の主要ページを巡回して全体像をまとめます（時間がかかります）"}
          </p>
        </div>

        <div style={styles.field}>
          <label htmlFor="url" style={styles.label}>
            {summaryType === "page" ? "記事のURL" : "サイトのURL"}
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setDuplicateWarning(false);
            }}
            placeholder="https://example.com/article"
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>要約レベル</label>
          <div style={styles.levelGroup}>
            {(["簡単", "普通", "詳しく"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                style={{
                  ...styles.levelButton,
                  ...(activeLevel === l ? styles.levelButtonActive : {}),
                }}
                disabled={loading}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Slack投稿先選択（複数登録がある場合のみ表示） */}
        {slackTargets.length > 0 && (
          <div style={styles.field}>
            <label style={styles.label}>Slack投稿先</label>
            <div style={styles.targetList}>
              <label style={styles.targetItem}>
                <input
                  type="checkbox"
                  checked={selectedTargets.has("default")}
                  onChange={(e) => {
                    const next = new Set(selectedTargets);
                    if (e.target.checked) next.add("default");
                    else next.delete("default");
                    setSelectedTargets(next);
                  }}
                />
                <span>デフォルト</span>
              </label>
              {slackTargets.map((target) => (
                <label key={target.id} style={styles.targetItem}>
                  <input
                    type="checkbox"
                    checked={selectedTargets.has(target.id)}
                    onChange={(e) => {
                      const next = new Set(selectedTargets);
                      if (e.target.checked) next.add(target.id);
                      else next.delete(target.id);
                      setSelectedTargets(next);
                    }}
                  />
                  <span>{target.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {duplicateWarning && (
          <div style={styles.warning}>
            <p style={styles.warningText}>
              このURLは既に要約済みです。もう一度要約しますか？
            </p>
            <button type="submit" style={styles.warningButton}>
              再要約する
            </button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          style={{
            ...styles.submitButton,
            ...(loading ? styles.submitButtonDisabled : {}),
          }}
          disabled={loading}
        >
          {loading
            ? summaryType === "site" ? "サイト分析中..." : "要約中..."
            : "要約する"}
        </button>
      </form>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#333",
  },
  input: {
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  levelGroup: {
    display: "flex",
    gap: "8px",
  },
  levelButton: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#555",
  },
  levelButtonActive: {
    border: "2px solid #4f46e5",
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 600,
  },
  warning: {
    padding: "12px 16px",
    background: "#fffbeb",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
  },
  warningText: {
    fontSize: "14px",
    color: "#92400e",
    margin: "0 0 8px 0",
  },
  warningButton: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#92400e",
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    margin: 0,
    padding: "8px 12px",
    background: "#fef2f2",
    borderRadius: "6px",
  },
  submitButton: {
    padding: "14px",
    fontSize: "16px",
    fontWeight: 600,
    color: "white",
    background: "#4f46e5",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  submitButtonDisabled: {
    background: "#9ca3af",
    cursor: "not-allowed",
  },
  typeGroup: {
    display: "flex",
    gap: "8px",
  },
  typeButton: {
    flex: 1,
    padding: "12px 10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  typeButtonActive: {
    border: "2px solid #4f46e5",
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 600,
  },
  typeIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#e5e7eb",
    fontSize: "11px",
    fontWeight: 700,
    color: "#555",
  },
  typeHint: {
    fontSize: "12px",
    color: "#999",
    margin: 0,
  },
  targetList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  targetItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#333",
    padding: "6px 10px",
    background: "#f8f9fa",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
