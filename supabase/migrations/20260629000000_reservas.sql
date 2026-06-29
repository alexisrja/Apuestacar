-- =============================================================================
-- Apuestacar — reservas (temporary ticket holds)
-- Run in Supabase SQL Editor (or via `supabase db push`).
-- =============================================================================
--
-- A reserva holds a set of numbers for a sorteo for a limited time (default 1h).
-- While `expires_at` is in the future the numbers are treated as "taken" and are
-- disabled in the public picker. If the payment is not confirmed before then the
-- hold lapses on its own (every read filters `expires_at > now()`) and the
-- numbers become selectable again — no cron job required.
--
-- Confirmed purchases (compras.estado = 'confirmada') lock the numbers
-- permanently and are handled separately in lib/sorteos.ts.
-- ----------------------------------------------------------------------------

create table if not exists public.reservas (
  id          uuid primary key default gen_random_uuid(),
  sorteo_id   text not null,
  numeros     text[] not null,
  user_id     uuid references auth.users (id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '1 hour'),
  created_at  timestamptz not null default now()
);

-- Fast lookup of the active holds for a sorteo.
create index if not exists reservas_sorteo_expires_idx
  on public.reservas (sorteo_id, expires_at);

alter table public.reservas enable row level security;

-- No client-side grants: all reads/writes go through Server Actions using the
-- service_role key (see app/boletos/actions.ts). RLS stays on with no policies,
-- so the anon/authenticated Data API roles cannot touch this table directly.
