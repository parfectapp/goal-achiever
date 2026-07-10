-- ============================================================
-- GOAL ACHIEVER · backend (nube familiar)
-- Pégalo UNA VEZ en supabase.com → tu proyecto → SQL Editor → Run
-- (mismo proyecto que usas para ABONO: fnxifbddgjyzwrolprel)
-- ============================================================

create table if not exists public.ga_hogares (
  codigo     text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ga_hogares enable row level security;

-- Acceso con la llave pública: la seguridad es el código de casa
-- (solo quien conoce el código CASA-XXXXXX puede leer/escribir su fila,
--  porque toda consulta va filtrada por codigo=eq.CASA-XXXXXX).
drop policy if exists ga_select on public.ga_hogares;
drop policy if exists ga_insert on public.ga_hogares;
drop policy if exists ga_update on public.ga_hogares;
create policy ga_select on public.ga_hogares for select using (true);
create policy ga_insert on public.ga_hogares for insert with check (true);
create policy ga_update on public.ga_hogares for update using (true);
