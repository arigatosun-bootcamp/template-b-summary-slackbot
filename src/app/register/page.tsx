"use client";

import { createClient } from "@/lib/supabase";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("このメールアドレスは既に登録されています");
      } else {
        setError("登録に失敗しました。もう一度お試しください");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>📧 確認メールを送信しました</h1>
          <p style={{ textAlign: "center", color: "#666", fontSize: "14px", lineHeight: 1.6 }}>
            <strong>{email}</strong> に確認メールを送りました。
            <br />
            メール内のリンクをクリックして認証を完了してください。
          </p>
          <div style={styles.links}>
            <Link href="/login" style={styles.link}>
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Summary Slackbot</h1>
        <p style={styles.subtitle}>新規登録</p>

        <form onSubmit={handleRegister}>
          <label style={styles.label}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            style={styles.input}
          />

          <label style={styles.label}>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            required
            style={styles.input}
          />

          <label style={styles.label}>パスワード（確認）</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="もう一度入力"
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>

        <div style={styles.links}>
          <Link href="/login" style={styles.link}>
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fa",
    padding: "24px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: "4px",
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: "14px",
    color: "#555",
    textAlign: "center" as const,
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#555",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  error: {
    color: "#f44336",
    fontSize: "13px",
    marginBottom: "12px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
  links: {
    textAlign: "center" as const,
    marginTop: "16px",
  },
  link: {
    color: "#2196f3",
    fontSize: "13px",
    textDecoration: "none",
  },
};
