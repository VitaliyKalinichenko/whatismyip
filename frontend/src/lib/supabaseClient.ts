import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ciupzfwuzkhzpzetrehl.supabase.co';  // <-- ВСТАВ сюди Project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdXB6Znd1emtoenB6ZXRyZWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTA5NDIsImV4cCI6MjA2OTcyNjk0Mn0.2tIbaajpYPxFjufoxNdUwYD5gwYLp93UnqzffO8r1Fs';                // <-- ВСТАВ сюди Publishable Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
