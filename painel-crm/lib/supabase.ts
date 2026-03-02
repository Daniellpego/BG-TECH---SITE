import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'URL_PROVISORIA';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'KEY_PROVISORIA';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
