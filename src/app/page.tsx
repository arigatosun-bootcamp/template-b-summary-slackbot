import { createServerSupabaseClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import SummaryForm from "@/components/SummaryForm";

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
          <SummaryForm />
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
    color: "#1a1a2e",
  },
  userInfo: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
};
