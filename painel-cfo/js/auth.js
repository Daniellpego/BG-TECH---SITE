// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Supabase Auth Module
// ═══════════════════════════════════════════════

import { CONFIG } from './config.js';

let supabaseClient = null;

export function getSupabase() {
    if (!supabaseClient) {
        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
            console.error('❌ Supabase configuration missing!');
        }
        // Initialize client using the window.supabase UMD library loaded in index.html
        supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

export async function signIn(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
}

export async function signOut() {
    const sb = getSupabase();
    await sb.auth.signOut();
    window.location.reload();
}

export async function getSession() {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    return session;
}

export function onAuthChange(callback) {
    const sb = getSupabase();
    sb.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null);
    });
}
