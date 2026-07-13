import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/api";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { supabase, json } = createRouteHandlerClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Simply get all user phrases and pick random ones
    const { data: allPhrases, error } = await supabase
      .from("phrases")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!allPhrases || allPhrases.length === 0) {
      return json({ phrases: [] });
    }

    // Shuffle and pick random phrases
    const shuffled = [...allPhrases].sort(() => Math.random() - 0.5);
    const studySet = shuffled.slice(0, Math.min(limit, shuffled.length));

    return json({ phrases: studySet });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
