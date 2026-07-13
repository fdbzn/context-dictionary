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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("phrases")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (search) {
      query = query.or(
        `content.ilike.%${search}%,tag_to_learn.ilike.%${search}%`,
      );
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return json({
      phrases: data,
      total: count,
      page,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, json } = createRouteHandlerClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    const phrases = Array.isArray(body) ? body : [body];

    const { data, error } = await supabase
      .from("phrases")
      .insert(
        phrases.map((p: Record<string, unknown>) => {
          const tags =
            Array.isArray(p.tags) && p.tags.length > 0
              ? p.tags
              : [
                  {
                    word: p.tag_to_learn || "",
                    meaning: p.tag_to_learn_meaning || null,
                  },
                ];
          const primaryTag = (
            tags as Array<{ word: string; meaning: string | null }>
          )[0];
          return {
            user_id: user.id,
            content: p.content,
            meaning: p.meaning,
            tag_to_learn: primaryTag?.word || "",
            tag_to_learn_meaning: primaryTag?.meaning || null,
            tags,
            image_url: p.image_url || null,
          };
        }),
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return json({ phrases: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
