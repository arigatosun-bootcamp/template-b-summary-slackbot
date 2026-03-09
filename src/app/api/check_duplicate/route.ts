import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ローカル開発用: URL重複チェック
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const url = searchParams.get("url");

    if (!userId || !url) {
      return NextResponse.json(
        { error: "user_idとurlが必要です" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization") || "";
    const authToken = authHeader.replace("Bearer ", "");

    if (!authToken) {
      return NextResponse.json({ exists: false, summary: null });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      }
    );

    const { data } = await supabase
      .from("summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("url", url)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      return NextResponse.json({ exists: true, summary: data[0] });
    }

    return NextResponse.json({ exists: false, summary: null });
  } catch {
    return NextResponse.json({ exists: false, summary: null });
  }
}
