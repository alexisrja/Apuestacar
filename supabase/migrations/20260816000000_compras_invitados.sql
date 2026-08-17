-- =============================================================================
-- Apuestacar — compras de invitados (checkout sin cuenta)
-- Run in Supabase SQL Editor (or via `supabase db push` if you adopt the CLI).
--
-- Depends on 20260609000000_compras_and_avatars.sql (compras table must exist).
--
-- Comprar ya no exige registro, así que una compra puede no tener `user_id`.
-- En ese caso los datos de contacto del formulario (nombre + WhatsApp) son el
-- único vínculo con el comprador, por eso pasan a ser obligatorios cuando la
-- fila es de invitado.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. user_id deja de ser obligatorio: null = compra de invitado.
-- ----------------------------------------------------------------------------
alter table public.compras
  alter column user_id drop not null;

-- ----------------------------------------------------------------------------
-- 2. Datos de contacto del comprador. `user_email` / `user_name` ya se venían
--    escribiendo desde el checkout; se crean aquí para dejarlos versionados.
--    `telefono` es nuevo: es el WhatsApp por el que se confirma el pago.
-- ----------------------------------------------------------------------------
alter table public.compras
  add column if not exists user_email text,
  add column if not exists user_name  text,
  add column if not exists telefono   text;

-- ----------------------------------------------------------------------------
-- 3. Una compra siempre tiene con quién contactar: o una cuenta, o nombre y
--    teléfono. Las filas existentes tienen user_id, así que la restricción
--    entra sin migración de datos.
-- ----------------------------------------------------------------------------
alter table public.compras
  drop constraint if exists compras_contacto_check;

alter table public.compras
  add constraint compras_contacto_check check (
    user_id is not null
    or (
      nullif(btrim(user_name), '') is not null
      and nullif(btrim(telefono), '') is not null
    )
  );

-- ----------------------------------------------------------------------------
-- 4. El listado del admin ordena por fecha sobre TODAS las compras. El índice
--    previo (user_id, created_at) ya no lo cubre ahora que user_id puede ser
--    null, así que se agrega uno por fecha.
-- ----------------------------------------------------------------------------
create index if not exists compras_created_at_idx
  on public.compras (created_at desc);

create index if not exists compras_estado_created_at_idx
  on public.compras (estado, created_at desc);

-- ----------------------------------------------------------------------------
-- 5. RLS: sin cambios a propósito.
--
--    NO se concede insert a `anon`. Una policy de inserción anónima dejaría a
--    cualquiera con la clave pública llenar la tabla de basura. Las compras de
--    invitado se insertan desde la Server Action `registrarCompra`
--    (app/boletos/actions.ts) con la service role key, que salta RLS y valida
--    el total contra el precio real del sorteo.
--
--    Las policies existentes siguen aplicando:
--      · compras_select_own   → un usuario ve sólo sus filas. Con user_id null
--                               la comparación da NULL, así que las compras de
--                               invitado quedan invisibles para los usuarios.
--      · compras_insert_own   → un usuario autenticado sigue pudiendo insertar
--                               sus propias filas.
--      · compras_select_admin / compras_update_admin → el admin ve y confirma
--                               todas, incluidas las de invitado.
-- ----------------------------------------------------------------------------

comment on column public.compras.user_id is
  'Cuenta dueña de la compra. NULL = compra de invitado (ver telefono/user_name).';
comment on column public.compras.telefono is
  'WhatsApp del comprador tal como lo capturó en el checkout.';
