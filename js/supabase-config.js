// ============================================================
// CONEXÃO COM O SUPABASE (Etapa 2)
// ============================================================
// 1. Crie um projeto em supabase.com
// 2. Vá em Project Settings > API
// 3. Copie a "Project URL" e cole em SUPABASE_URL abaixo
// 4. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY abaixo
//
// IMPORTANTE: a chave "anon public" é segura para ficar no código do
// site (front-end) — ela só permite o que as regras de RLS liberarem.
// NUNCA coloque aqui a chave "service_role" (essa é secreta).
// ============================================================

const SUPABASE_URL = "https://zxcjnhwhokebusxrkclh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MmtoIGsA7ZtvYUXyekIjLg_tneAMGzk";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
