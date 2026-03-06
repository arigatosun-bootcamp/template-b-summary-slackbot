"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header style={styles.header}>
      <Link href="/" style={styles.logo}>
        Summary Slackbot
      </Link>
      <nav style={styles.nav}>
        <Link href="/" style={styles.navLink}>トップ</Link>
        <Link href="/history" style={styles.navLink}>履歴</Link>
        <Link href="/settings" style={styles.navLink}>設定</Link>
        <button onClick={handleLogout} style={styles.logoutButton}>
          ログアウト
        </button>
      </nav>
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    background: "#16213e",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    color: "white",
    fontWeight: 700,
    fontSize: "16px",
    textDecoration: "none",
  },
  nav: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  navLink: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    textDecoration: "none",
  },
  logoutButton: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
};
