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

    const { count: totalPhrases } = await supabase
      .from("phrases")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: totalSessions } = await supabase
      .from("study_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: correctAnswers } = await supabase
      .from("study_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_correct", true);

    const { count: incorrectAnswers } = await supabase
      .from("study_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_correct", false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: studiedToday } = await supabase
      .from("study_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString());

    let currentStreak = 0;
    let checkDate = new Date();

    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { count: sessionsThatDay } = await supabase
        .from("study_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      if (sessionsThatDay && sessionsThatDay > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return json({
      total_phrases: totalPhrases || 0,
      total_study_sessions: totalSessions || 0,
      correct_answers: correctAnswers || 0,
      incorrect_answers: incorrectAnswers || 0,
      studied_today: (studiedToday || 0) > 0,
      current_streak: currentStreak,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
