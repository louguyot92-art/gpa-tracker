import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qddscdrmxjiwcmkcairx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZHNjZHJteGppd2Nta2NhaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTUxMjYsImV4cCI6MjA5Mjc5MTEyNn0.2CdW1cZMQNVTNEnn5TJuhL26Cgtcp5JkzFumQXMma9Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
