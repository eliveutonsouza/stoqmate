"use client";

import type { Database } from "@/lib/supabase/database.types";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
