-- ============================================================
-- COMPRA BOA JF — Schema do banco de dados (Etapa 2)
-- Como usar: copie TODO este arquivo e cole no
-- Supabase > SQL Editor > New Query > Run
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. MERCADOS (supermercados parceiros)
-- ============================================================
create table markets (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    address text,
    neighborhood text,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    logo_url text,
    erp_system text,              -- ex: 'linear', 'outro_erp' (ajuda no mapeamento do arquivo importado)
    contact_email text,           -- e-mail de onde os arquivos de preço serão enviados
    active boolean not null default true,
    created_at timestamptz not null default now()
);

comment on table markets is 'Supermercados cadastrados na plataforma';

-- ============================================================
-- 2. PRODUTOS (catálogo central / canônico)
-- ============================================================
create table products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    brand text,
    category text,                -- ex: 'Bebidas', 'Laticínios', 'Carnes', 'Cereais'
    unit text,                    -- ex: 'kg', 'l', 'un', '500g'
    barcode text unique,          -- código de barras (EAN), quando disponível
    image_url text,
    created_at timestamptz not null default now()
);

create index idx_products_name on products using gin (to_tsvector('portuguese', name));
create index idx_products_category on products (category);
create index idx_products_barcode on products (barcode);

comment on table products is 'Catálogo central de produtos — cada mercado vende o "mesmo" produto, referenciado aqui';

-- ============================================================
-- 3. PREÇOS ATUAIS (preço de um produto em um mercado específico)
-- ============================================================
create table market_products (
    id uuid primary key default gen_random_uuid(),
    market_id uuid not null references markets(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    price numeric(10, 2) not null,
    in_stock boolean not null default true,
    last_updated timestamptz not null default now(),
    unique (market_id, product_id)
);

create index idx_market_products_product on market_products (product_id);
create index idx_market_products_market on market_products (market_id);

comment on table market_products is 'Preço ATUAL de cada produto em cada mercado (1 linha por par mercado+produto)';

-- ============================================================
-- 4. HISTÓRICO DE PREÇOS (para curva de preço / alertas)
-- ============================================================
create table price_history (
    id uuid primary key default gen_random_uuid(),
    market_id uuid not null references markets(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    price numeric(10, 2) not null,
    recorded_at timestamptz not null default now()
);

create index idx_price_history_product_date on price_history (product_id, recorded_at desc);

comment on table price_history is 'Cada atualização de preço gera um registro aqui — usado para gráficos e alertas';

-- ============================================================
-- 5. PERFIS DE USUÁRIO (estende a tabela auth.users do Supabase)
-- ============================================================
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    cpf text unique,
    phone text,
    plan text not null default 'none' check (plan in ('none', 'basico', 'premium')),
    subscription_status text not null default 'inactive' check (subscription_status in ('inactive', 'trial', 'active', 'canceled')),
    trial_ends_at timestamptz,
    total_savings numeric(10, 2) not null default 0,
    created_at timestamptz not null default now()
);

comment on table profiles is 'Dados adicionais do usuário (auth.users já guarda email/senha)';

-- ============================================================
-- 6. ALERTAS DE PREÇO
-- ============================================================
create table price_alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    target_price numeric(10, 2) not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create index idx_price_alerts_user on price_alerts (user_id);

-- ============================================================
-- 7. CARRINHO (persistido por usuário, opcional)
-- ============================================================
create table cart_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    market_id uuid references markets(id) on delete set null,
    quantity integer not null default 1,
    added_at timestamptz not null default now()
);

create index idx_cart_items_user on cart_items (user_id);

-- ============================================================
-- 8. SOLICITAÇÕES DE PARCERIA (formulário "Seja Parceiro")
-- ============================================================
create table partner_requests (
    id uuid primary key default gen_random_uuid(),
    market_name text not null,
    contact_name text not null,
    email text not null,
    phone text,
    address text,
    status text not null default 'pending' check (status in ('pending', 'contacted', 'approved', 'rejected')),
    created_at timestamptz not null default now()
);

-- ============================================================
-- 9. MENSAGENS DE CONTATO (formulário "Entre em Contato")
-- ============================================================
create table contact_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    subject text,
    message text not null,
    created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Define quem pode ler/escrever em cada tabela
-- ============================================================

-- Tabelas públicas para LEITURA (qualquer visitante pode ver preços, mesmo sem login)
alter table markets enable row level security;
alter table products enable row level security;
alter table market_products enable row level security;
alter table price_history enable row level security;

create policy "Mercados são públicos para leitura" on markets
    for select using (true);

create policy "Produtos são públicos para leitura" on products
    for select using (true);

create policy "Preços são públicos para leitura" on market_products
    for select using (true);

create policy "Histórico de preços é público para leitura" on price_history
    for select using (true);

-- Tabelas privadas: cada usuário só vê/edita os próprios dados
alter table profiles enable row level security;
alter table price_alerts enable row level security;
alter table cart_items enable row level security;

create policy "Usuário vê o próprio perfil" on profiles
    for select using (auth.uid() = id);

create policy "Usuário edita o próprio perfil" on profiles
    for update using (auth.uid() = id);

create policy "Usuário cria o próprio perfil" on profiles
    for insert with check (auth.uid() = id);

create policy "Usuário vê os próprios alertas" on price_alerts
    for select using (auth.uid() = user_id);

create policy "Usuário cria os próprios alertas" on price_alerts
    for insert with check (auth.uid() = user_id);

create policy "Usuário remove os próprios alertas" on price_alerts
    for delete using (auth.uid() = user_id);

create policy "Usuário gerencia o próprio carrinho (ver)" on cart_items
    for select using (auth.uid() = user_id);

create policy "Usuário gerencia o próprio carrinho (criar)" on cart_items
    for insert with check (auth.uid() = user_id);

create policy "Usuário gerencia o próprio carrinho (editar)" on cart_items
    for update using (auth.uid() = user_id);

create policy "Usuário gerencia o próprio carrinho (remover)" on cart_items
    for delete using (auth.uid() = user_id);

-- Formulários públicos: qualquer um pode ENVIAR, ninguém de fora pode LER
alter table partner_requests enable row level security;
alter table contact_messages enable row level security;

create policy "Qualquer um pode solicitar parceria" on partner_requests
    for insert with check (true);

create policy "Qualquer um pode enviar mensagem de contato" on contact_messages
    for insert with check (true);

-- ============================================================
-- TRIGGER: cria automaticamente um "profile" quando um usuário se cadastra
-- ============================================================
create function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
