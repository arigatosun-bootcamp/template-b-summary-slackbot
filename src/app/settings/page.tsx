"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase";

interface SlackTarget {
  id: string;
  name: string;
  webhookUrl: string;
}

function loadSlackTargets(): SlackTarget[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("slackTargets");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [defaultLevel, setDefaultLevel] = useState<"簡単" | "普通" | "詳しく">(() => {
    if (typeof window === "undefined") return "普通";
    const stored = localStorage.getItem("defaultLevel");
    if (stored && ["簡単", "普通", "詳しく"].includes(stored)) {
      return stored as "簡単" | "普通" | "詳しく";
    }
    return "普通";
  });
  const [saved, setSaved] = useState(false);

  // Slack投稿先管理
  const [slackTargets, setSlackTargets] = useState<SlackTarget[]>(() => loadSlackTargets());
  const [newName, setNewName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [slackError, setSlackError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setEmail(session.user.email || "");
    };

    loadSettings();
  }, [router, supabase.auth]);

  const handleSave = () => {
    localStorage.setItem("defaultLevel", defaultLevel);
    localStorage.setItem("slackTargets", JSON.stringify(slackTargets));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddSlack = () => {
    setSlackError("");
    if (!newName.trim()) {
      setSlackError("表示名を入力してください");
      return;
    }
    if (!newWebhookUrl.trim() || !newWebhookUrl.startsWith("https://hooks.slack.com/")) {
      setSlackError("正しいSlack Webhook URLを入力してください");
      return;
    }

    const newTarget: SlackTarget = {
      id: Date.now().toString(),
      name: newName.trim(),
      webhookUrl: newWebhookUrl.trim(),
    };

    setSlackTargets([...slackTargets, newTarget]);
    setNewName("");
    setNewWebhookUrl("");
    setSaved(false);
  };

  const handleRemoveSlack = (id: string) => {
    setSlackTargets(slackTargets.filter((t) => t.id !== id));
    setSaved(false);
  };

  return (
    <div>
      <Header />
      <main style={styles.main}>
        <h2 style={styles.heading}>設定</h2>

        {/* アカウント情報 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>アカウント情報</h3>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>メールアドレス</span>
            <span style={styles.infoValue}>{email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>LLMプロバイダ</span>
            <span style={styles.infoValue}>OpenAI (gpt-4o-mini)</span>
          </div>
        </div>

        {/* デフォルト要約レベル */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>デフォルト要約レベル</h3>
          <p style={styles.description}>
            要約フォームで初期選択されるレベルを変更できます。
          </p>
          <div style={styles.levelGroup}>
            {(["簡単", "普通", "詳しく"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setDefaultLevel(l);
                  setSaved(false);
                }}
                style={{
                  ...styles.levelButton,
                  ...(defaultLevel === l ? styles.levelButtonActive : {}),
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Slack投稿先管理 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Slack投稿先</h3>
          <p style={styles.description}>
            要約を投稿するSlackチャンネルを複数登録できます。
            要約時に投稿先を選択できます。
          </p>

          {/* デフォルト（環境変数） */}
          <div style={styles.slackItem}>
            <div>
              <span style={styles.slackName}>デフォルト</span>
              <span style={styles.slackDefault}>（環境変数で設定）</span>
            </div>
          </div>

          {/* 追加された投稿先 */}
          {slackTargets.map((target) => (
            <div key={target.id} style={styles.slackItem}>
              <div>
                <span style={styles.slackName}>{target.name}</span>
                <span style={styles.slackUrl}>
                  {target.webhookUrl.substring(0, 40)}...
                </span>
              </div>
              <button
                onClick={() => handleRemoveSlack(target.id)}
                style={styles.removeButton}
              >
                削除
              </button>
            </div>
          ))}

          {/* 新規追加フォーム */}
          <div style={styles.addForm}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="表示名（例: 開発チーム）"
              style={styles.addInput}
            />
            <input
              type="text"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="Webhook URL（https://hooks.slack.com/...）"
              style={styles.addInput}
            />
            {slackError && <p style={styles.slackError}>{slackError}</p>}
            <button onClick={handleAddSlack} style={styles.addButton}>
              投稿先を追加
            </button>
          </div>
        </div>

        {/* 保存ボタン */}
        <button onClick={handleSave} style={styles.saveButton}>
          {saved ? "保存しました" : "設定を保存"}
        </button>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "#1a1a2e",
  },
  section: {
    background: "white",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: "12px",
  },
  description: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "12px",
    lineHeight: 1.5,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  infoLabel: {
    fontSize: "14px",
    color: "#555",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a1a2e",
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
    color: "#555",
  },
  levelButtonActive: {
    border: "2px solid #4f46e5",
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 600,
  },
  slackItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    background: "#f8f9fa",
    borderRadius: "8px",
    marginBottom: "8px",
  },
  slackName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a1a2e",
  },
  slackDefault: {
    fontSize: "12px",
    color: "#888",
    marginLeft: "8px",
  },
  slackUrl: {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginTop: "2px",
  },
  removeButton: {
    padding: "4px 12px",
    fontSize: "12px",
    color: "#dc2626",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    cursor: "pointer",
  },
  addForm: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  addInput: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "white",
  },
  slackError: {
    color: "#dc2626",
    fontSize: "13px",
    margin: 0,
  },
  addButton: {
    padding: "10px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#4f46e5",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    cursor: "pointer",
  },
  saveButton: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    fontWeight: 600,
    color: "white",
    background: "#4f46e5",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "16px",
  },
};
