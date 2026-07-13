import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export function createRouteHandlerClient(request: NextRequest) {
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: boolean | "lax" | "strict" | "none";
      path?: string;
      maxAge?: number;
    };
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookies) {
          for (const cookie of newCookies) {
            request.cookies.set(cookie.name, cookie.value);
            cookiesToSet.push(cookie);
          }
        },
      },
    },
  );

  function applyCookies(response: NextResponse): NextResponse {
    for (const cookie of cookiesToSet) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return response;
  }

  function json(data: unknown, init?: ResponseInit): NextResponse {
    const response = NextResponse.json(data, init);
    return applyCookies(response);
  }

  return { supabase, json, applyCookies };
}
