import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

/**
 * ローカル開発用: Python要約スクリプトを呼び出すプロキシ
 * 本番（Vercel）では api/summarize.py が優先される
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, level = "普通", type = "page", user_id = "" } = body;

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get("Authorization") || "";
    const authToken = authHeader.replace("Bearer ", "");

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: "URLを入力してください" },
        { status: 400 }
      );
    }

    if (!["簡単", "普通", "詳しく"].includes(level)) {
      return NextResponse.json(
        { error: "要約レベルは「簡単」「普通」「詳しく」のいずれかを指定してください" },
        { status: 400 }
      );
    }

    const result = await runPythonScript(
      JSON.stringify({ url, level, type, user_id, auth_token: authToken })
    );
    return NextResponse.json(JSON.parse(result));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "サーバーエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function runPythonScript(inputJson: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "summarize_local.py"
    );

    const proc = spawn("python3", [scriptPath], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdin.write(inputJson);
    proc.stdin.end();

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        try {
          const errorData = JSON.parse(stderr || stdout);
          reject(new Error(errorData.error || "Python処理でエラーが発生しました"));
        } catch {
          reject(new Error(stderr || "Python処理でエラーが発生しました"));
        }
        return;
      }
      resolve(stdout);
    });

    proc.on("error", (err) => {
      reject(
        new Error(
          `Python実行エラー: ${err.message}。python3がインストールされているか確認してください`
        )
      );
    });
  });
}
