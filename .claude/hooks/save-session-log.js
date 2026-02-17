#!/usr/bin/env node
// セッション終了時に会話ログを自動保存するフック
// ユーザーが送ったプロンプト一覧 + 原本JSONLを .claude/logs/ に保存する

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let stdinData = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  stdinData += chunk;
});
process.stdin.on("end", () => {
  try {
    main(stdinData);
  } catch (e) {
    // フックのエラーでClaude Codeを止めない
    process.exit(0);
  }
});
// stdinが来ない場合のタイムアウト
setTimeout(() => {
  try {
    main(stdinData);
  } catch (e) {
    process.exit(0);
  }
}, 5000);

function main(stdin) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  if (!projectDir) return;

  const logDir = path.join(projectDir, ".claude", "logs");
  fs.mkdirSync(logDir, { recursive: true });

  // セッションIDを取得（stdin or 環境変数）
  let sessionId;
  try {
    const hookData = JSON.parse(stdin);
    sessionId = hookData.session_id;
  } catch {}
  sessionId = sessionId || process.env.CLAUDE_SESSION_ID;
  if (!sessionId) return;

  // Claude Codeの内部データからJSONLファイルを探す
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const claudeProjectsDir = path.join(homeDir, ".claude", "projects");

  // プロジェクトパスをClaude内部形式に変換
  // C:\Users\OWNER\Desktop\... → C--Users-OWNER-Desktop-...
  const internalName = projectDir.replace(/:/g, "-").replace(/[\\/]/g, "-");
  const jsonlPath = path.join(
    claudeProjectsDir,
    internalName,
    `${sessionId}.jsonl`
  );

  if (!fs.existsSync(jsonlPath)) return;

  // メタデータ取得
  let branch = "unknown";
  try {
    branch = execSync("git branch --show-current", {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {}

  let gitUser = "unknown";
  try {
    gitUser = execSync("git config user.name", {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {}

  // JONLを解析してユーザーメッセージを抽出
  const lines = fs.readFileSync(jsonlPath, "utf8").split("\n").filter(Boolean);
  const userMessages = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === "user" && entry.message) {
        const content = entry.message.content;
        let text = "";
        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          // マルチモーダル（画像+テキスト等）の場合、テキスト部分だけ抽出
          text = content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n");
          // 画像がある場合は注記
          const imageCount = content.filter(
            (block) => block.type === "image"
          ).length;
          if (imageCount > 0) {
            text += `\n[画像 ${imageCount}枚添付]`;
          }
        }

        if (text.trim()) {
          userMessages.push({
            timestamp: entry.timestamp || "",
            content: text.trim(),
          });
        }
      }
    } catch {}
  }

  // タイムスタンプ
  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace(/[T:]/g, "-");

  // Markdownログを生成
  const projectName = path.basename(projectDir);
  let md = `# Claude Code セッションログ\n\n`;
  md += `| 項目 | 値 |\n`;
  md += `|------|----|\n`;
  md += `| **プロジェクト** | ${projectName} |\n`;
  md += `| **日時** | ${now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} |\n`;
  md += `| **ユーザー** | ${gitUser} |\n`;
  md += `| **ブランチ** | ${branch} |\n`;
  md += `| **セッションID** | \`${sessionId}\` |\n`;
  md += `| **プロンプト数** | ${userMessages.length} |\n\n`;
  md += `---\n\n`;
  md += `## プロンプト一覧\n\n`;

  for (let i = 0; i < userMessages.length; i++) {
    const msg = userMessages[i];
    const time = msg.timestamp
      ? new Date(msg.timestamp).toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo",
        })
      : "";
    md += `### ${i + 1}. [${time}]\n\n`;
    md += `\`\`\`\n${msg.content}\n\`\`\`\n\n`;
  }

  // セッションIDベースのファイル名（同セッションは上書き）
  const mdFile = path.join(logDir, `${sessionId}.md`);
  const jsonlCopy = path.join(logDir, `${sessionId}.jsonl`);

  fs.writeFileSync(mdFile, md, "utf8");
  fs.copyFileSync(jsonlPath, jsonlCopy);
}
