"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const supabase = createClient();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <Link href="/" className="header-logo">
        Summary Slackbot
      </Link>

      {/* ハンバーガーボタン（スマホのみ表示） */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="メニュー"
      >
        <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
      </button>

      {/* ナビゲーション */}
      <nav className={`header-nav ${menuOpen ? "nav-open" : ""}`}>
        <Link href="/" className="nav-link" onClick={handleNavClick}>
          トップ
        </Link>
        <Link href="/history" className="nav-link" onClick={handleNavClick}>
          履歴
        </Link>
        <Link href="/settings" className="nav-link" onClick={handleNavClick}>
          設定
        </Link>
        <button onClick={handleLogout} className="logout-button">
          ログアウト
        </button>
      </nav>

      {/* メニュー開いたときの背景オーバーレイ */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </header>
  );
}
