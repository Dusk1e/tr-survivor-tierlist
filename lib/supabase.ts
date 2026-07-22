import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Two server-side clients:
 *  - anon:    read-only public access (respects Row Level Security)
 *  - service: full access for authenticated admin writes (server only!)
 *
 * These are only ever imported from server code (API routes). The
 * service role key must NEVER reach the browser.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const MICE_TABLE = "mice";

/**
 * Next.js, route handler içindeki fetch çağrılarını önbelleğe alabiliyor.
 * Supabase de veriyi fetch ile çektiği için sorgu sonuçları donup kalıyordu:
 * panelden kaydedilen değer veritabanına yazılıyor ama okuyan uç eski
 * cevabı döndürüyordu. Bütün Supabase istekleri HER ZAMAN taze olmalı.
 */
const tazeFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

let _anon: SupabaseClient | null = null;
let _service: SupabaseClient | null = null;

export function supabaseAnon(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!_anon) {
    _anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { fetch: tazeFetch },
    });
  }
  return _anon;
}

export function supabaseService(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!_service) {
    _service = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { fetch: tazeFetch },
    });
  }
  return _service;
}

export const cloudConfigured = Boolean(url && anonKey);
