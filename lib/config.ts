/**
 * Runtime feature detection.
 * The whole app works in "Local Demo Mode" (browser localStorage).
 * When the public Supabase env vars are present, it switches to the
 * shared cloud database automatically.
 */

// Available on both client & server (NEXT_PUBLIC_* is inlined at build).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
