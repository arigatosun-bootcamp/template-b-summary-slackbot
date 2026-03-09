"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { SummarizeResponse } from "@/lib/api";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("summaryResult");
    if (stored) {
      setResult(JSON.parse(stored));
    }
    setChecked(true);
  }, []);

  // マウント完了前は何も表示しない
  if (!checked) {
    return null;
  }

  // マウント後にデータがなければトップに戻る
  if (!result) {
    router.push("/");
    return null;
  }

  const handleBack = () => {
    router.push("/");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.summary);
      alert("要約をコピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  };

  return (
    <div>
      <Header />
      <main style={styles.main}>
        <h2 style={styles.heading}>要約結果</h2>

        {/* 記事情報 */}
        <div style={styles.metaCard}>
          <p style={styles.title}>{result.title || "タイトルなし"}</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.url}
          >
            {result.url}
          </a>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <span style={styles.levelBadge}>{result.level}</span>
            {result.type === "site" && (
              <span style={styles.siteBadge}>
                サイト全体（{result.page_count}ページ）
              </span>
            )}
          </div>
        </div>

        {/* 要約本文 */}
        <div style={styles.summaryCard}>
          <p style={styles.summaryText}>{result.summary}</p>
        </div>

        {/* アクションボタン */}
        <div style={styles.actions}>
          <button onClick={handleCopy} style={styles.copyButton}>
            コピー
          </button>
          <button onClick={handleBack} style={styles.backButton}>
            戻って別の記事を要約
          </button>
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
    marginBottom: "20px",
    color: "#1a1a2e",
  },
  metaCard: {
    background: "#f8f9fa",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1a1a2e",
    margin: "0 0 6px 0",
  },
  url: {
    fontSize: "13px",
    color: "#4f46e5",
    textDecoration: "none",
    wordBreak: "break-all" as const,
  },
  levelBadge: {
    display: "inline-block",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#4f46e5",
    background: "#eef2ff",
    borderRadius: "20px",
  },
  siteBadge: {
    display: "inline-block",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#059669",
    background: "#ecfdf5",
    borderRadius: "20px",
  },
  summaryCard: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
  },
  summaryText: {
    fontSize: "15px",
    lineHeight: 1.8,
    color: "#333",
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  copyButton: {
    flex: 1,
    padding: "12px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#4f46e5",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "10px",
    cursor: "pointer",
  },
  backButton: {
    flex: 2,
    padding: "12px",
    fontSize: "15px",
    fontWeight: 600,
    color: "white",
    background: "#4f46e5",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};
