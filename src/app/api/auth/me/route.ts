import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/api";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
