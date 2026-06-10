-- =============================================================================
-- Apuestacar — compras (ticket purchase requests) + avatars storage
-- Run in Supabase SQL Editor (or via `supabase db push` if you adopt the CLI).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. compras: one row per WhatsApp checkout submitted by a signed-in user.
--    `estado` reflects the manual WhatsApp confirmation flow.
-- ----------------------------------------------------------------------------
create table if not exists public.compras (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  sorteo_id      text not null,
  sorteo_numero  integer,
  sorteo_titulo  text,
  sorteo_premio  text,
  numeros        text[] not null,
  cantidad       integer not null,
  total          numeric not null,
  estado         text not null default 'pendiente'
                   check (estado in ('pendiente', 'confirmada', 'cancelada')),
  created_at     timestamptz not null default now()
);

create index if not exists compras_user_id_created_at_idx
  on public.compras (user_id, created_at desc);

alter table public.compras enable row level security;

-- A user can read only their own purchases.
drop policy if exists "compras_select_own" on public.compras;
create policy "compras_select_own" on public.compras
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- A user can insert only rows owned by themselves.
drop policy if exists "compras_insert_own" on public.compras;
create policy "compras_insert_own" on public.compras
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Expose to the Data API (no UPDATE/DELETE granted — purchases are immutable
-- from the client; confirmation is handled server-side / by an admin).
grant select, insert on public.compras to authenticated;

-- ----------------------------------------------------------------------------
-- 2. avatars storage bucket (public read, owner-only write).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read avatar files (bucket is public).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- A user can upload only into a folder named after their own uid.
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A user can replace (upsert) only their own files. Upsert needs INSERT +
-- SELECT + UPDATE; SELECT is covered by the public read policy above.
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A user can delete only their own files (cleanup of old avatars).
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
