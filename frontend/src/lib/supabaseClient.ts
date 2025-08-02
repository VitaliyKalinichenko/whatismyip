import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ciupzfwuzkhzpzetrehl.supabase.co';  // <-- ВСТАВ сюди Project URL
const supabaseAnonKey = 'sb_publishable_pNlhw3LimZ0UJSNXExTa7w_YYHPNC0H';                // <-- ВСТАВ сюди Publishable Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
