-- Extensao para UUID
create extension if not exists "pgcrypto";

-- Tabela principal de configuracao do dashboard
create table if not exists public.configuracoes_dashboard (
  id uuid primary key default gen_random_uuid(),
  contagem_atual integer not null default 500 check (contagem_atual >= 0),
  meta_mensal integer not null default 20 check (meta_mensal >= 0),
  meta_anual integer not null default 240 check (meta_anual >= 0),
  cor_fundo text not null default '#0f172a',
  cor_texto text not null default '#ffffff',
  familia_fonte text not null default 'Inter',
  url_logo text not null default '',
  updated_at timestamptz not null default timezone('utc', now())
);

-- Mantem updated_at atualizado automaticamente
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists tr_configuracoes_dashboard_touch_updated_at on public.configuracoes_dashboard;
create trigger tr_configuracoes_dashboard_touch_updated_at
before update on public.configuracoes_dashboard
for each row
execute function public.touch_updated_at();

-- Garante que exista somente 1 linha de configuracao
create unique index if not exists idx_configuracoes_dashboard_singleton
on public.configuracoes_dashboard ((true));

-- Tabela opcional de perfil de administradores
create table if not exists public.usuarios_admin (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  created_at timestamptz not null default timezone('utc', now())
);

-- RLS
alter table public.configuracoes_dashboard enable row level security;
alter table public.usuarios_admin enable row level security;

-- TV publica pode ler configuracoes
drop policy if exists "Public can read dashboard configuration" on public.configuracoes_dashboard;
create policy "Public can read dashboard configuration"
on public.configuracoes_dashboard
for select
using (true);

-- Somente usuarios autenticados podem atualizar configuracoes
drop policy if exists "Authenticated can update dashboard configuration" on public.configuracoes_dashboard;
create policy "Authenticated can update dashboard configuration"
on public.configuracoes_dashboard
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can insert dashboard configuration" on public.configuracoes_dashboard;
create policy "Authenticated can insert dashboard configuration"
on public.configuracoes_dashboard
for insert
to authenticated
with check (true);

-- usuarios_admin: cada admin ve apenas seu proprio perfil
drop policy if exists "Admin can view own profile" on public.usuarios_admin;
create policy "Admin can view own profile"
on public.usuarios_admin
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admin can insert own profile" on public.usuarios_admin;
create policy "Admin can insert own profile"
on public.usuarios_admin
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Admin can update own profile" on public.usuarios_admin;
create policy "Admin can update own profile"
on public.usuarios_admin
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Registro inicial (singleton)
insert into public.configuracoes_dashboard (
  contagem_atual,
  meta_mensal,
  meta_anual,
  cor_fundo,
  cor_texto,
  familia_fonte,
  url_logo
)
select
  500,
  20,
  240,
  '#0f172a',
  '#ffffff',
  'Inter',
  ''
where not exists (
  select 1 from public.configuracoes_dashboard
);

-- Opcional: adicionar tabela ao Realtime no Supabase UI:
-- Database -> Replication -> habilitar para configuracoes_dashboard.
