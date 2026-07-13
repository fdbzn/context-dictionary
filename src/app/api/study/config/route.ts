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

    const { data } = await supabase
      .from("user_settings")
      .select("phrases_per_session")
      .eq("user_id", user.id)
      .single();

    return json({
      phrases_per_session: data?.phrases_per_session || 10,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, json } = createRouteHandlerClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { phrases_per_session } = await request.json();

    if (!phrases_per_session || phrases_per_session < 1) {
      return NextResponse.json(
        { error: "phrases_per_session must be at least 1" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, phrases_per_session },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
