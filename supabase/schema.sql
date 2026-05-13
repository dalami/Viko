-- =============================================
-- VIKO — SCHEMA SUPABASE
-- Ejecutar en: Supabase → SQL Editor → New Query
-- =============================================

-- 1. TABLA EMPRENDIMIENTOS
create table if not exists public.emprendimientos (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  nombre        text not null default '',
  rubro         text not null default '',
  tagline       text not null default '',
  descripcion          text not null default '',
  ubicacion     text,
  whatsapp      text not null default '',
  instagram     text,
  email         text,
  web           text,
  plan          text not null default 'basic' check (plan in ('basic', 'featured', 'premium')),
  envios        boolean not null default false,
  visible       boolean not null default true,
  images        text[] not null default '{}',
  "destacadoSemana" boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. TABLA PRODUCTOS
create table if not exists public.productos (
  id                  bigint generated always as identity primary key,
  emprendimiento_id   bigint references public.emprendimientos(id) on delete cascade not null,
  nombre              text not null,
  descripcion         text,
  precio              numeric(10,2) not null default 0,
  categoria           text,
  activo              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.emprendimientos enable row level security;
alter table public.productos enable row level security;

-- Emprendimientos: lectura pública de visibles
create policy "Lectura pública de emprendimientos visibles"
  on public.emprendimientos for select
  using (visible = true);

-- Emprendimientos: el dueño puede ver, editar y borrar el suyo
create policy "Dueño puede leer su emprendimiento"
  on public.emprendimientos for select
  using (auth.uid() = user_id);

create policy "Dueño puede editar su emprendimiento"
  on public.emprendimientos for update
  using (auth.uid() = user_id);

create policy "Dueño puede crear su emprendimiento"
  on public.emprendimientos for insert
  with check (auth.uid() = user_id);

-- Productos: lectura pública
create policy "Lectura pública de productos"
  on public.productos for select
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = emprendimiento_id and e.visible = true
    )
  );

-- Productos: el dueño del emprendimiento puede gestionar sus productos
create policy "Dueño puede gestionar productos"
  on public.productos for all
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = emprendimiento_id and e.user_id = auth.uid()
    )
  );

-- 4. TRIGGER: updated_at automático
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger emprendimientos_updated_at
  before update on public.emprendimientos
  for each row execute function public.handle_updated_at();
