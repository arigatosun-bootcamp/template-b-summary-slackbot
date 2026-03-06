"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase";

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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

        {/* 保存ボタン */}
        <button onClick={handleSave} style={styles.saveButton}>
          {saved ? "保存しました" : "設定を保存"}
        </button>

        {/* Slack連携情報 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Slack連携</h3>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>投稿先</span>
            <span style={styles.infoValue}>
              {process.env.NEXT_PUBLIC_SLACK_CHANNEL || "環境変数で設定済み"}
            </span>
          </div>
          <p style={styles.description}>
            Slack Webhook URLは環境変数（SLACK_WEBHOOK_URL）で管理されています。
            変更する場合は .env.local を編集してください。
          </p>
        </div>
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
