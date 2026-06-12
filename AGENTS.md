<!-- Pending SQL to run in Supabase Dashboard > SQL Editor: -->
<!--
alter table public.sorteos add column if not exists imagen text not null default '';

alter table public.compras add column if not exists user_email text;
alter table public.compras add column if not exists user_name text;

create table if not exists public.resultados (
  id bigint primary key generated always as identity,
  sorteo_numero integer not null,
  fecha text not null,
  ganador text not null,
  numero text not null,
  premio text not null,
  created_at timestamptz default now()
);

create table if not exists public.testimonios (
  id bigint primary key generated always as identity,
  name text not null,
  text text not null,
  prize text not null,
  avatar text not null,
  created_at timestamptz default now()
);
-->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
