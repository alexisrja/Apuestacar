-- =============================================================================
-- Apuestacar — sorteos table + admin role (email allow-list) + admin RLS.
-- Run in Supabase SQL Editor (or via `supabase db push`).
-- Depends on 20260609000000_compras_and_avatars.sql (compras table must exist).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. admin_emails: the source of truth for "who is an admin" inside the DB.
--    RLS policies below check the current user's JWT email against this table.
--    Keep it in sync with the app-level ADMIN_EMAILS env var (used only for
--    routing / UI gating — never for granting DB writes).
-- ----------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
);

-- Seed the first admin. Replace / add rows as needed.
insert into public.admin_emails (email)
values ('alexis.rja62@gmail.com')
on conflict (email) do nothing;

-- RLS off: this table is only ever read by the SECURITY DEFINER function below,
-- never exposed to the Data API.
revoke all on public.admin_emails from anon, authenticated;

-- is_admin(): true when the authenticated user's email is allow-listed.
-- SECURITY DEFINER so RLS policies can read admin_emails without granting
-- clients direct access to it.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_emails ae
    where lower(ae.email) = lower(nullif(auth.email(), ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 2. sorteos: previously a static TS file (app/data/sorteos.ts), now DB-backed
--    so admins can CRUD them. `id` is the public slug used in URLs (/boletos/:id)
--    and mirrors `numero` as text for clean, stable links.
-- ----------------------------------------------------------------------------
create table if not exists public.sorteos (
  id             text primary key,
  numero         integer not null unique,
  titulo         text not null,
  premio         text not null,
  valor          text not null default '',
  descripcion    text not null default '',
  fecha          timestamptz not null,
  fecha_label    text not null default '',
  precio_boleto  numeric not null default 0,
  total_boletos  integer not null default 100,
  vendidos       integer not null default 0,
  emoji          text not null default '🎟️',
  destacado      boolean not null default false,
  estado         text not null default 'activo'
                   check (estado in ('activo', 'proximo')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists sorteos_estado_numero_idx
  on public.sorteos (estado, numero desc);

-- Seed with the three sorteos that used to live in code.
insert into public.sorteos
  (id, numero, titulo, premio, valor, descripcion, fecha, fecha_label,
   precio_boleto, total_boletos, vendidos, emoji, destacado, estado)
values
  ('12', 12, 'Gran Premio Final', 'MacBook Neo 2026', '$14,999 MXN',
   'Nuestro premio estrella: el nuevo MacBook Neo con chip de última generación, pantalla Liquid Retina y 32GB de RAM. El sorteo más esperado del año.',
   '2026-07-15T20:00:00+00', '15 Julio, 2026', 10, 100, 67, '💻', true, 'activo'),
  ('13', 13, 'Sorteo del Viajero', 'Viaje a Dubai', '$25,000 MXN',
   '7 días todo incluido para 2 personas en el Burj Khalifa. Vuelos, hotel 5 estrellas y experiencias premium incluidas.',
   '2026-08-01T20:00:00+00', '1 Agosto, 2026', 15, 100, 31, '✈️', false, 'activo'),
  ('14', 14, 'Sorteo Millonario', 'Efectivo $50,000', '$50,000 MXN',
   'Premio en efectivo sin condiciones. Depósito directo a tu cuenta dentro de las 48 horas posteriores al sorteo.',
   '2026-08-20T20:00:00+00', '20 Agosto, 2026', 20, 100, 12, '💰', false, 'activo')
on conflict (id) do nothing;

alter table public.sorteos enable row level security;

-- Anyone (even anonymous visitors) can read sorteos — it's a public catalog.
drop policy if exists "sorteos_select_public" on public.sorteos;
create policy "sorteos_select_public" on public.sorteos
  for select to anon, authenticated
  using (true);

-- Only admins can create / update / delete sorteos.
drop policy if exists "sorteos_insert_admin" on public.sorteos;
create policy "sorteos_insert_admin" on public.sorteos
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "sorteos_update_admin" on public.sorteos;
create policy "sorteos_update_admin" on public.sorteos
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "sorteos_delete_admin" on public.sorteos;
create policy "sorteos_delete_admin" on public.sorteos
  for delete to authenticated
  using (public.is_admin());

grant select on public.sorteos to anon, authenticated;
grant insert, update, delete on public.sorteos to authenticated;

-- ----------------------------------------------------------------------------
-- 3. compras: let admins read ALL purchases and update their `estado`
--    (confirm / cancel). Regular users keep their own-row select from the
--    previous migration.
-- ----------------------------------------------------------------------------
drop policy if exists "compras_select_admin" on public.compras;
create policy "compras_select_admin" on public.compras
  for select to authenticated
  using (public.is_admin());

drop policy if exists "compras_update_admin" on public.compras;
create policy "compras_update_admin" on public.compras
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant update on public.compras to authenticated;
