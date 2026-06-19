// ============================================================
// CONEXÃO COM O SUPABASE (Etapa 2)
// ============================================================

const SUPABASE_URL = "https://zxcjnhwhokebusxrkclh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MmtoIGsA7ZtvYUXyekIjLg_tneAMGzk";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
