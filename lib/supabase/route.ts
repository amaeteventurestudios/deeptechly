import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createSupabaseRouteClient(request: NextRequest) {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const cookiesToSet: CookieToSet[] = [];
  const headersToSet = new Map<string, string>();

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies, headers) {
        cookiesToSet.push(...nextCookies);
        nextCookies.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        Object.entries(headers).forEach(([key, value]) => {
          headersToSet.set(key, value);
        });
      }
    }
  });

  function applyAuthCookies(response: NextResponse) {
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    headersToSet.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  return { supabase, applyAuthCookies };
}
