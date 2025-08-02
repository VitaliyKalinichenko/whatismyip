import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ciupzfwuzkhzpzetrehl.supabase.co';  // <-- ВСТАВ сюди Project URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;                // <-- ВСТАВ сюди Publishable Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
