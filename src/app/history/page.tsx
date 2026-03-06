"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase";
import { getHistory, type SummaryRecord } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const data = await getHistory(session.user.id, session.access_token);
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "履歴の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router, supabase.auth]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <Header />
      <main style={styles.main}>
        <h2 style={styles.heading}>要約履歴</h2>

        {loading && <p style={styles.loading}>読み込み中...</p>}

        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && records.length === 0 && (
          <div style={styles.empty}>
            <p>まだ要約履歴がありません。</p>
            <button onClick={() => router.push("/")} style={styles.goButton}>
              記事を要約する
            </button>
          </div>
        )}

        {records.map((record) => (
          <div
            key={record.id}
            style={styles.card}
            onClick={() =>
              setExpandedId(expandedId === record.id ? null : record.id)
            }
          >
            <div style={styles.cardHeader}>
              <p style={styles.cardTitle}>{record.title || "タイトルなし"}</p>
              <span style={styles.cardDate}>{formatDate(record.created_at)}</span>
            </div>
            <a
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.cardUrl}
              onClick={(e) => e.stopPropagation()}
            >
              {record.url}
            </a>
            <div style={styles.cardMeta}>
              <span style={styles.badge}>{record.summary_level}</span>
              <span style={styles.badgeProvider}>{record.llm_provider}</span>
            </div>

            {expandedId === record.id && (
              <div style={styles.summaryBox}>
                <p style={styles.summaryText}>{record.summary}</p>
              </div>
            )}
          </div>
        ))}
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
  loading: {
    textAlign: "center",
    color: "#888",
    padding: "40px 0",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    padding: "12px",
    background: "#fef2f2",
    borderRadius: "8px",
  },
  empty: {
    textAlign: "center",
    padding: "40px 0",
    color: "#888",
  },
  goButton: {
    marginTop: "16px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: 600,
    color: "white",
    background: "#4f46e5",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "box-shadow 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1a1a2e",
    margin: 0,
    flex: 1,
  },
  cardDate: {
    fontSize: "12px",
    color: "#999",
    whiteSpace: "nowrap" as const,
  },
  cardUrl: {
    display: "block",
    fontSize: "12px",
    color: "#4f46e5",
    textDecoration: "none",
    marginTop: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  cardMeta: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  badge: {
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#4f46e5",
    background: "#eef2ff",
    borderRadius: "20px",
  },
  badgeProvider: {
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#059669",
    background: "#ecfdf5",
    borderRadius: "20px",
  },
  summaryBox: {
    marginTop: "12px",
    padding: "12px 16px",
    background: "#f8f9fa",
    borderRadius: "8px",
    borderLeft: "3px solid #4f46e5",
  },
  summaryText: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#333",
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
};
