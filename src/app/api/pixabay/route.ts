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
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    const pixabayKey = process.env.PIXABAY_API_KEY;
    if (!pixabayKey) {
      return NextResponse.json(
        { error: "Pixabay API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(
        query,
      )}&page=${page}&per_page=${perPage}&lang=en&image_type=photo&safesearch=true`,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch images from Pixabay" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
