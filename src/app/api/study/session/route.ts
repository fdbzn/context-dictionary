import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/api";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { supabase, json } = createRouteHandlerClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { phrase_id, is_correct, user_example } = await request.json();

    if (!phrase_id || is_correct === undefined) {
      return NextResponse.json(
        { error: "phrase_id and is_correct are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        phrase_id,
        is_correct,
        user_example: user_example || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
