import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase-ritmo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-ritmo';
const masterToken =
  process.env.NEXT_PUBLIC_RITMO_MASTER_TOKEN ||
  process.env.RITMO_MASTER_TOKEN ||
  'rtm_sec_a8f9c2d1e04b789123456789abcdef';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-ritmo-token': masterToken,
    },
  },
});

export const supabaseBrowserClient = supabase;

export const getSupabaseBrowserClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-ritmo-token': masterToken,
      },
    },
  });
};
