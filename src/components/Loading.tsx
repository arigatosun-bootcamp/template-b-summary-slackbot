"use client";

export default function Loading({ message = "要約を生成中..." }: { message?: string }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.spinner} />
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  container: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #4f46e5",
    borderRadius: "50%",
    margin: "0 auto 16px",
    animation: "spin 1s linear infinite",
  },
  message: {
    color: "#555",
    fontSize: "15px",
    margin: 0,
  },
};
