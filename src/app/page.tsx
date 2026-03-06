import { createServerSupabaseClient } from "@/lib/supabase-server";
import Header from "@/components/Header";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <Header />
      <main style={styles.main}>
        <h2 style={styles.heading}>記事を要約する</h2>
        <p style={styles.userInfo}>ログイン中: {user?.email}</p>
        <div style={styles.card}>
          <p style={styles.placeholder}>
            📝 Day2で要約フォームを実装します
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
    marginBottom: "8px",
  },
  userInfo: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "40px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    textAlign: "center" as const,
  },
  placeholder: {
    color: "#999",
    fontSize: "16px",
  },
};
