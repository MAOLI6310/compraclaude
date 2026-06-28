-- ============================================================
-- COMPRA BOA JF — Etapa 5: Admin e logs de importação
-- Rode este script no Supabase SQL Editor
-- ============================================================

-- 1. Adiciona o valor 'admin' aos planos permitidos
--    (precisamos alterar o check constraint da tabela profiles)
alter table profiles
    drop constraint if exists profiles_plan_check;

alter table profiles
    add constraint profiles_plan_check
    check (plan in ('none', 'basico', 'premium', 'admin'));

-- 2. Tabela de logs de importação
create table if not exists import_logs (
    id uuid primary key default gen_random_uuid(),
    market_id uuid references markets(id) on delete set null,
    file_name text not null,
    total_rows integer not null default 0,
    updated_prices integer not null default 0,
    new_products integer not null default 0,
    review_queue integer not null default 0,
    errors integer not null default 0,
    imported_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- Só admins podem ver os logs
alter table import_logs enable row level security;

create policy "Admins veem todos os logs" on import_logs
    for select using (
        exists (
            select 1 from profiles
            where id = auth.uid() and plan = 'admin'
        )
    );

create policy "Admins inserem logs" on import_logs
    for insert with check (
        exists (
            select 1 from profiles
            where id = auth.uid() and plan = 'admin'
        )
    );

-- 3. Admins podem inserir/atualizar produtos e preços
--    (as políticas existentes só permitem leitura pública)

-- Produtos: admin pode inserir e atualizar
create policy "Admins inserem produtos" on products
    for insert with check (
        exists (select 1 from profiles where id = auth.uid() and plan = 'admin')
    );

create policy "Admins atualizam produtos" on products
    for update using (
        exists (select 1 from profiles where id = auth.uid() and plan = 'admin')
    );

-- Preços: admin pode inserir, atualizar e deletar
create policy "Admins inserem preços" on market_products
    for insert with check (
        exists (select 1 from profiles where id = auth.uid() and plan = 'admin')
    );

create policy "Admins atualizam preços" on market_products
    for update using (
        exists (select 1 from profiles where id = auth.uid() and plan = 'admin')
    );

-- Histórico de preços: admin pode inserir
create policy "Admins inserem histórico" on price_history
    for insert with check (
        exists (select 1 from profiles where id = auth.uid() and plan = 'admin')
    );

-- ============================================================
-- 4. Crie sua conta de admin:
--
--    a) Crie uma conta NORMAL no site primeiro (vai em compraclaude.vercel.app
--       e clica em "Criar Conta" com seu e-mail pessoal)
--    b) Depois rode o UPDATE abaixo substituindo pelo SEU e-mail:
-- ============================================================

-- UPDATE profiles
-- SET plan = 'admin'
-- WHERE id = (
--     SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI@gmail.com'
-- );
