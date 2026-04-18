/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// These would normally come from your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pahwzqtrjhmvotdkchia.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_V0IQ3m-L60NJO2R8JXLbxw_S0sQBZIb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
