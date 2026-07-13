import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/api";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { supabase, json } = createRouteHandlerClient(request);

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return json({ message: "Logged out successfully" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
