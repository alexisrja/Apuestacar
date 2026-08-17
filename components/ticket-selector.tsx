"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Sorteo } from "@/app/data/sorteos";
import {
  createClient,
  isInvalidRefreshTokenError,
  supabaseConfigured,
} from "@/lib/supabase/client";
import { PROMOS, calcularTotal, getPromo } from "@/lib/promos";
import {
  liberarReserva,
  registrarCompra,
  reservarBoletos,
} from "@/app/boletos/actions";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

/** Grids larger than this get a "jump to number" filter above them. */
const BUSCADOR_DESDE = 60;

interface FormData {
  nombre: string;
  telefono: string;
  email: string;
}

type Step = "promo" | "select" | "form" | "sent";

/** The three real stages of a compra. `promo` is a fork inside "Números". */
const PASOS = ["Números", "Datos", "WhatsApp"] as const;

const pasoActual = (step: Step) =>
  step === "form" ? 1 : step === "sent" ? 2 : 0;

function StepRail({ step }: { step: Step }) {
  const actual = pasoActual(step);
  return (
    <ol
      className="mx-auto mt-6 flex max-w-md items-center gap-2"
      aria-label="Progreso de la compra"
    >
      {PASOS.map((nombre, i) => {
        const hecho = i < actual;
        const activo = i === actual;
        return (
          <li key={nombre} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1 rounded-full transition-colors duration-300 ${
                hecho
                  ? "bg-primary"
                  : activo
                    ? "bg-gradient-to-r from-primary to-accent"
                    : "bg-border/60"
              }`}
            />
            <span
              className={`font-heading text-[0.65rem] tracking-wider transition-colors duration-300 ${
                activo
                  ? "text-accent"
                  : hecho
                    ? "text-secondary"
                    : "text-secondary/50"
              }`}
              aria-current={activo ? "step" : undefined}
            >
              {i + 1}. {nombre.toUpperCase()}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function TicketSelector({
  sorteo,
  takenNumbers = [],
  promoCantidad,
  volverUrl,
}: {
  sorteo: Sorteo;
  takenNumbers?: string[];
  promoCantidad?: number;
  /** Ruta de esta misma compra, para volver aquí tras iniciar sesión. */
  volverUrl?: string;
}) {
  const allNumbers = useMemo(
    () =>
      Array.from({ length: sorteo.totalBoletos }, (_, i) =>
        String(i + 1).padStart(3, "0"),
      ),
    [sorteo.totalBoletos],
  );

  // Promo válida sólo si la cantidad existe en el catálogo de promos.
  const promo = promoCantidad ? getPromo(promoCantidad) : null;
  const limite = promo?.cantidad ?? null;

  const [selected, setSelected] = useState<string[]>([]);
  // Numbers discovered as taken locally (a reservation collided with a fresh
  // hold). Merged with the server-provided list below.
  const [extraTaken, setExtraTaken] = useState<string[]>([]);
  const taken = useMemo(
    () => new Set([...takenNumbers, ...extraTaken]),
    [takenNumbers, extraTaken],
  );
  const disponibles = allNumbers.length - taken.size;
  const [cantidadAleatoria, setCantidadAleatoria] = useState("5");
  const [filtro, setFiltro] = useState("");
  const [step, setStep] = useState<Step>(promo ? "promo" : "select");
  // Active hold for the current selection: id (to release) + expiry (countdown).
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [reservaError, setReservaError] = useState<string | null>(null);
  const [isReserving, startReserving] = useTransition();
  const [form, setForm] = useState<FormData>({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [tocado, setTocado] = useState<Record<keyof FormData, boolean>>({
    nombre: false,
    telefono: false,
    email: false,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // URL del hand-off a WhatsApp: la guardamos para poder reabrirla si el
  // navegador bloqueó la ventana emergente.
  const [waUrl, setWaUrl] = useState<string | null>(null);

  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Identify the signed-in user (if any) to link the purchase and prefill data.
  // La sesión es opcional: sin ella la compra sigue funcionando como invitado.
  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        const user = data.user;
        if (!user) return;
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        setForm((prev) => ({
          ...prev,
          nombre:
            prev.nombre ||
            ((user.user_metadata?.full_name as string | undefined) ?? ""),
          email: prev.email || (user.email ?? ""),
        }));
      })
      .catch(async (error) => {
        if (!isInvalidRefreshTokenError(error)) return;

        await supabase.auth.signOut({ scope: "local" });
      });
  }, []);

  // Live countdown of the hold (mm:ss). Recomputed every second while in the
  // form/sent steps so the user knows how long their boletos stay apartados.
  const [restante, setRestante] = useState<number>(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRestante(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const vencido = expiresAt !== null && restante === 0;
  const porVencer = !vencido && restante > 0 && restante < 5 * 60 * 1000;
  const mmss = `${String(Math.floor(restante / 60000)).padStart(2, "0")}:${String(
    Math.floor((restante % 60000) / 1000),
  ).padStart(2, "0")}`;

  const toggleNumber = (num: string) => {
    if (step !== "select") return;
    if (taken.has(num)) return;
    setReservaError(null);
    setSelected((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      // En modo promo no se permite exceder la cantidad del paquete.
      if (limite && prev.length >= limite) return prev;
      return [...prev, num];
    });
  };

  // Elige `n` números aleatorios entre los disponibles (no apartados). Devuelve
  // los elegidos para poder apartarlos sin esperar al re-render del estado.
  const pickRandom = (n: number): string[] => {
    const libres = allNumbers.filter((x) => !taken.has(x));
    const barajados = [...libres].sort(() => Math.random() - 0.5);
    const elegidos = barajados.slice(0, n);
    setSelected(elegidos);
    return elegidos;
  };

  // Aparta los números elegidos por 1 hora y avanza al formulario. Si alguno ya
  // fue tomado entre la carga y el clic, los marca como ocupados y regresa a la
  // selección para que el usuario elija de nuevo.
  const apartarYAvanzar = (nums: string[]) => {
    if (nums.length === 0) return;
    setReservaError(null);
    startReserving(async () => {
      const res = await reservarBoletos(sorteo.id, nums);
      if (!res.ok) {
        if (res.ocupados?.length) {
          setExtraTaken((prev) => [...new Set([...prev, ...res.ocupados!])]);
          setSelected((prev) => prev.filter((n) => !res.ocupados!.includes(n)));
        }
        setReservaError(
          res.error ?? "No se pudieron apartar los boletos. Intenta de nuevo.",
        );
        setStep("select");
        return;
      }
      setReservaId(res.reservaId ?? null);
      setExpiresAt(res.expiresAt ? new Date(res.expiresAt).getTime() : null);
      setStep("form");
    });
  };

  // Libera la reserva activa (al volver atrás o reiniciar) para no dejar boletos
  // apartados de más. Fire-and-forget.
  const soltarReserva = () => {
    if (reservaId) void liberarReserva(reservaId, sorteo.id);
    setReservaId(null);
    setExpiresAt(null);
  };

  const promoActiva = getPromo(selected.length);
  const total = calcularTotal(selected.length, sorteo.precioBoleto);
  const ahorro = promoActiva
    ? selected.length * sorteo.precioBoleto - total
    : 0;

  // Validación en línea: el mensaje explica la causa y cómo corregirla.
  const errores: Record<keyof FormData, string | null> = {
    nombre:
      form.nombre.trim().length < 3
        ? "Escribe tu nombre completo (mínimo 3 letras)."
        : null,
    telefono:
      form.telefono.replace(/\D/g, "").length < 10
        ? "Faltan dígitos: necesitamos los 10 de tu WhatsApp."
        : null,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())
      ? null
      : "Revisa el correo: falta el @ o el dominio.",
  };
  const formValido = !errores.nombre && !errores.telefono && !errores.email;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValido) {
      setTocado({ nombre: true, telefono: true, email: true });
      const primero = errores.nombre
        ? nombreRef
        : errores.telefono
          ? telefonoRef
          : emailRef;
      primero.current?.focus();
      return;
    }
    if (vencido) return;

    const numbersList = selected.join(", ");
    // Mensaje en texto plano con saltos de línea reales; se codifica entero al
    // final. Codificar por partes deja sin escapar caracteres como "#", que
    // WhatsApp/URL interpreta como fragmento y trunca el mensaje.
    const message = `¡Hola! Quiero comprar boletos del *Sorteo #${sorteo.numero} — ${sorteo.titulo}* (premio: ${sorteo.premio}).\n\n📋 *Datos del comprador:*\n👤 Nombre: ${form.nombre}\n📞 Teléfono: ${form.telefono}\n✉️ Email: ${form.email}\n\n🎫 *Números seleccionados:* ${numbersList}\n💰 *Total: $${total} MXN*\n\n¡Gracias!`;

    // Registra la solicitud para que aparezca en el panel de admin (y en "Mis
    // Boletos" si hay sesión). Invitados incluidos: la Server Action decide el
    // dueño con la cookie y recalcula el total. Fire-and-forget — el hand-off a
    // WhatsApp nunca espera a la escritura.
    void registrarCompra({
      sorteoId: sorteo.id,
      numeros: selected,
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
    }).then((res) => {
      if (!res.ok) console.error("Error al guardar compra:", res.error);
    });

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    setWaUrl(url);
    window.open(url, "_blank");

    setStep("sent");
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Con promo hay que completar exactamente el paquete; sin promo basta con 1.
  const puedeAvanzar = limite
    ? selected.length === limite
    : selected.length > 0;
  const faltan = limite ? limite - selected.length : 0;

  const visibles = filtro
    ? allNumbers.filter((n) => n.includes(filtro.replace(/\D/g, "")))
    : allNumbers;

  const inputBase =
    "w-full rounded-lg border bg-muted px-4 py-3 font-body text-sm text-white placeholder-secondary/50 outline-none transition-colors focus:ring-1";
  const inputEstado = (campo: keyof FormData) =>
    tocado[campo] && errores[campo]
      ? "border-destructive/70 focus:border-destructive focus:ring-destructive"
      : "border-border focus:border-primary focus:ring-primary";

  return (
    <div className="page-fade">
      <div className="text-center">
        <h1 className="font-heading text-3xl leading-tight tracking-tight text-white sm:text-4xl">
          {step === "promo" && "Tu "}
          {step === "select" && "Elige tus "}
          {step === "form" && "Tus Datos "}
          {step === "sent" && "Solicitud "}
          <span className="text-gradient">
            {step === "promo" && "Promo"}
            {step === "select" && "Números"}
            {step === "form" && "Personales"}
            {step === "sent" && "Enviada"}
          </span>
        </h1>
        <p className="mt-2 font-heading text-sm tracking-wider text-secondary">
          SORTEO #{sorteo.numero} · {sorteo.titulo}
        </p>

        <StepRail step={step} />

        {step === "select" && promo && (
          <p className="mx-auto mt-5 max-w-lg font-body text-sm text-secondary">
            Selecciona{" "}
            <span className="font-heading tabular-nums text-accent">
              {selected.length} de {promo.cantidad}
            </span>{" "}
            boletos de tu paquete.
          </p>
        )}
        {step === "select" && !promo && (
          <p className="mx-auto mt-5 max-w-lg font-body text-sm text-secondary">
            Cada boleto cuesta{" "}
            <span className="font-heading tabular-nums text-accent">
              ${sorteo.precioBoleto} MXN
            </span>
            . Quedan{" "}
            <span className="font-heading tabular-nums text-white">
              {disponibles}
            </span>{" "}
            de {sorteo.totalBoletos} disponibles.
          </p>
        )}
        {step === "select" && !userId && (
          <p className="mx-auto mt-2 max-w-lg font-body text-xs text-secondary/80">
            Puedes comprar sin cuenta.{" "}
            <Link
              href={`/login${volverUrl ? `?next=${encodeURIComponent(volverUrl)}` : ""}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              Inicia sesión
            </Link>{" "}
            si quieres seguir tus boletos desde Mi Perfil.
          </p>
        )}
        {step === "select" && !promo && (
          <div className="mx-auto mt-4 flex max-w-lg flex-wrap items-center justify-center gap-2">
            {PROMOS.map((p) => {
              const activa = selected.length === p.cantidad;
              return (
                <span
                  key={p.cantidad}
                  className={`rounded-full border px-3 py-1 font-heading text-xs tabular-nums transition-colors ${
                    activa
                      ? "border-accent bg-accent/20 text-accent glow-text"
                      : "border-border bg-muted text-secondary"
                  }`}
                >
                  {p.cantidad} boletos por ${p.precio} MXN
                </span>
              );
            })}
          </div>
        )}
        {step === "form" && (
          <p className="mx-auto mt-5 max-w-lg font-body text-sm text-secondary">
            Con estos datos te confirmamos el pago de{" "}
            <span className="font-heading tabular-nums text-primary">
              {selected.length}
            </span>{" "}
            {selected.length === 1 ? "boleto" : "boletos"}.
          </p>
        )}
        {step === "promo" && promo && (
          <p className="mx-auto mt-5 max-w-lg font-body text-sm text-secondary">
            Paquete de{" "}
            <span className="font-heading tabular-nums text-accent">
              {promo.cantidad} boletos por ${promo.precio} MXN
            </span>
            . ¿Cómo quieres tus números?
          </p>
        )}
      </div>

      {step === "promo" && promo && (
        <div className="mx-auto mt-8 grid max-w-2xl gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSelected([]);
              setStep("select");
            }}
            className="boleto group rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/15 to-surface p-7 text-center hover:-translate-y-1 hover:border-primary"
          >
            <div className="text-4xl" aria-hidden="true">
              ✋
            </div>
            <p className="mt-3 font-heading text-lg text-white">
              Elegir yo mismo
            </p>
            <p className="mt-2 font-body text-sm text-secondary">
              Escoge tus {promo.cantidad} números de la suerte uno por uno.
            </p>
          </button>
          <button
            type="button"
            onClick={() => apartarYAvanzar(pickRandom(promo.cantidad))}
            disabled={isReserving}
            className="boleto group rounded-2xl border border-accent/60 bg-gradient-to-br from-accent/15 to-surface p-7 text-center hover:-translate-y-1 hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="text-4xl" aria-hidden="true">
              🎲
            </div>
            <p className="mt-3 font-heading text-lg text-white">
              {isReserving ? "Apartando…" : "Números aleatorios"}
            </p>
            <p className="mt-2 font-body text-sm text-secondary">
              Te asignamos {promo.cantidad} números al azar y listo.
            </p>
          </button>
        </div>
      )}

      {step === "select" && (
        <>
          {!promo && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface/60 p-4 sm:flex-row">
              <p className="font-heading text-sm text-secondary">
                ¿Sin tiempo de elegir? Deja que la suerte decida:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={disponibles}
                  inputMode="numeric"
                  aria-label="Cantidad de boletos aleatorios"
                  value={cantidadAleatoria}
                  onChange={(e) => setCantidadAleatoria(e.target.value)}
                  className="h-11 w-20 rounded-lg border border-border bg-muted px-3 text-center font-heading text-sm tabular-nums text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const n = Math.min(
                      Math.max(1, Math.floor(Number(cantidadAleatoria) || 0)),
                      disponibles,
                    );
                    pickRandom(n);
                  }}
                  className="btn-accent boleto text-sm whitespace-nowrap"
                >
                  🎲 Aleatorios
                </button>
              </div>
            </div>
          )}

          {reservaError && (
            <p
              role="alert"
              className="mx-auto mt-6 max-w-lg rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center font-body text-sm text-[#FCA5A5]"
            >
              {reservaError}
            </p>
          )}

          {selected.length > 0 && (
            <div className="materialize mt-8 rounded-xl border border-border/70 bg-surface/50 p-4">
              <p className="font-heading text-xs tracking-wider text-secondary">
                TUS NÚMEROS ({selected.length}
                {limite ? ` / ${limite}` : ""})
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {selected.map((num) => (
                  <li key={num}>
                    <button
                      type="button"
                      onClick={() => toggleNumber(num)}
                      className="boleto flex h-9 items-center gap-1.5 rounded-full border border-primary/60 bg-primary/15 pl-3 pr-2 font-heading text-sm text-white hover:border-destructive/70 hover:bg-destructive/15"
                      aria-label={`Quitar el número ${num}`}
                    >
                      {num}
                      <span aria-hidden="true" className="text-secondary">
                        ×
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allNumbers.length > BUSCADOR_DESDE && (
            <div className="mt-6">
              <label
                htmlFor="filtro-numero"
                className="block font-heading text-xs tracking-wider text-secondary"
              >
                BUSCAR NÚMERO
              </label>
              <input
                id="filtro-numero"
                type="text"
                inputMode="numeric"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Ej: 07"
                className="mt-1.5 h-11 w-full max-w-xs rounded-lg border border-border bg-muted px-4 font-heading text-sm tabular-nums text-white placeholder-secondary/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {visibles.length === 0 ? (
            <p className="mt-8 rounded-xl border border-border bg-surface/60 p-8 text-center font-body text-sm text-secondary">
              Ningún boleto contiene “{filtro}”.{" "}
              <button
                type="button"
                onClick={() => setFiltro("")}
                className="font-heading text-accent underline-offset-4 hover:underline"
              >
                Ver todos
              </button>
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-5 gap-2 pb-4 sm:grid-cols-10">
              {visibles.map((num) => {
                const isSelected = selected.includes(num);
                const isTaken = taken.has(num);
                const bloqueado =
                  !isSelected && !isTaken && limite !== null &&
                  selected.length >= limite;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isTaken}
                    // Con el paquete lleno los números siguen enfocables (y
                    // anunciados) pero no seleccionables: `disabled` los sacaría
                    // del orden de tabulación sin explicar por qué.
                    aria-disabled={bloqueado || undefined}
                    onClick={() => toggleNumber(num)}
                    aria-pressed={isSelected}
                    aria-label={`Número ${num}${isSelected ? ", seleccionado" : ""}${isTaken ? ", no disponible" : ""}${bloqueado ? ", paquete completo" : ""}`}
                    className={`boleto flex h-12 items-center justify-center rounded-lg border text-sm font-heading ${
                      isTaken
                        ? "cursor-not-allowed border-destructive/30 bg-destructive/5 text-[#FCA5A5]/60 line-through"
                        : isSelected
                          ? "boleto-on border-primary bg-primary text-white"
                          : bloqueado
                            ? "cursor-not-allowed border-border/50 bg-muted/40 text-foreground/30"
                            : "border-border bg-muted text-foreground hover:border-primary hover:bg-primary/20"
                    }`}
                  >
                    {isTaken ? "✕" : num}
                  </button>
                );
              })}
            </div>
          )}

          <div className="taquilla sticky bottom-4 mt-8 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="font-heading text-xs tracking-wider text-secondary">
                  BOLETOS
                </p>
                <p className="font-heading text-2xl tabular-nums text-white">
                  {selected.length}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="font-heading text-xs tracking-wider text-secondary">
                  TOTAL
                </p>
                <p className="font-heading text-3xl tabular-nums text-accent glow-text">
                  ${total}
                </p>
                {promoActiva && ahorro > 0 && (
                  <p className="font-heading text-xs tabular-nums text-primary">
                    Promo aplicada · ahorras ${ahorro}
                  </p>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {promo && (
                  <button
                    type="button"
                    onClick={() => pickRandom(promo.cantidad)}
                    className="btn-outline boleto w-full text-sm sm:w-auto"
                  >
                    🎲 Sorpréndeme
                  </button>
                )}
                <button
                  type="button"
                  disabled={!puedeAvanzar || isReserving}
                  onClick={() => apartarYAvanzar(selected)}
                  className={`btn-accent boleto w-full sm:w-auto ${
                    !puedeAvanzar || isReserving
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {isReserving ? "Apartando…" : "Continuar"}
                </button>
              </div>
            </div>
            {!puedeAvanzar && (
              <p className="mt-3 text-center font-body text-xs text-secondary sm:text-right">
                {limite
                  ? `Te ${faltan === 1 ? "falta" : "faltan"} ${faltan} ${faltan === 1 ? "boleto" : "boletos"} para completar el paquete.`
                  : "Elige al menos un número para continuar."}
              </p>
            )}
          </div>
        </>
      )}

      {step === "form" && (
        <>
          {expiresAt && (
            <div
              className={`materialize mx-auto mt-8 flex max-w-lg items-start gap-3 rounded-xl border px-4 py-3 ${
                vencido
                  ? "border-destructive/50 bg-destructive/10"
                  : porVencer
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-accent/40 bg-accent/10"
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {vencido ? "⌛" : "⏳"}
              </span>
              {vencido ? (
                <div className="font-body text-sm text-secondary">
                  <p className="font-heading text-[#FCA5A5]">
                    Tu apartado venció
                  </p>
                  <p className="mt-1">
                    Tus números volvieron a estar disponibles. Apártalos de
                    nuevo para seguir con el pago.
                  </p>
                  <button
                    type="button"
                    disabled={isReserving}
                    onClick={() => apartarYAvanzar(selected)}
                    className="btn-accent boleto mt-3 text-sm"
                  >
                    {isReserving ? "Apartando…" : "Apartar de nuevo"}
                  </button>
                </div>
              ) : (
                <p className="font-body text-sm text-secondary">
                  Apartamos tus boletos{" "}
                  <span
                    className={`font-heading tabular-nums ${
                      porVencer ? "timer-urgent text-[#FCA5A5]" : "text-accent"
                    }`}
                  >
                    {mmss}
                  </span>{" "}
                  más. Confirma tu pago antes de que termine o volverán a estar
                  disponibles.
                </p>
              )}
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            noValidate
            className="mx-auto mt-6 max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8"
          >
            <p className="font-body text-xs text-secondary">
              {userId ? (
                <>
                  Compra ligada a tu cuenta
                  {userEmail ? ` · ${userEmail}` : ""}. Aparecerá en Mi Perfil.
                </>
              ) : (
                <>Compra como invitado. No necesitas cuenta para continuar.</>
              )}
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="nombre"
                  className="block font-heading text-sm text-secondary"
                >
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  ref={nombreRef}
                  type="text"
                  required
                  autoComplete="name"
                  value={form.nombre}
                  onChange={(e) => updateForm("nombre", e.target.value)}
                  onBlur={() =>
                    setTocado((t) => ({ ...t, nombre: true }))
                  }
                  aria-invalid={tocado.nombre && !!errores.nombre}
                  aria-describedby={
                    tocado.nombre && errores.nombre ? "nombre-error" : undefined
                  }
                  placeholder="Ej: Juan Pérez"
                  className={`mt-1.5 ${inputBase} ${inputEstado("nombre")}`}
                />
                {tocado.nombre && errores.nombre && (
                  <p
                    id="nombre-error"
                    role="alert"
                    className="mt-1.5 font-body text-xs text-[#FCA5A5]"
                  >
                    {errores.nombre}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="telefono"
                  className="block font-heading text-sm text-secondary"
                >
                  WhatsApp
                </label>
                <input
                  id="telefono"
                  ref={telefonoRef}
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={(e) => updateForm("telefono", e.target.value)}
                  onBlur={() =>
                    setTocado((t) => ({ ...t, telefono: true }))
                  }
                  aria-invalid={tocado.telefono && !!errores.telefono}
                  aria-describedby={
                    tocado.telefono && errores.telefono
                      ? "telefono-error"
                      : "telefono-ayuda"
                  }
                  placeholder="Ej: 5512345678"
                  className={`mt-1.5 tabular-nums ${inputBase} ${inputEstado("telefono")}`}
                />
                {tocado.telefono && errores.telefono ? (
                  <p
                    id="telefono-error"
                    role="alert"
                    className="mt-1.5 font-body text-xs text-[#FCA5A5]"
                  >
                    {errores.telefono}
                  </p>
                ) : (
                  <p
                    id="telefono-ayuda"
                    className="mt-1.5 font-body text-xs text-secondary/70"
                  >
                    A este número te confirmamos el pago. 10 dígitos, sin lada
                    internacional.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block font-heading text-sm text-secondary"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  onBlur={() => setTocado((t) => ({ ...t, email: true }))}
                  aria-invalid={tocado.email && !!errores.email}
                  aria-describedby={
                    tocado.email && errores.email ? "email-error" : undefined
                  }
                  placeholder="Ej: correo@ejemplo.com"
                  className={`mt-1.5 ${inputBase} ${inputEstado("email")}`}
                />
                {tocado.email && errores.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-1.5 font-body text-xs text-[#FCA5A5]"
                  >
                    {errores.email}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border/50 bg-muted/50 p-4">
              <p className="font-heading text-xs tracking-wider text-secondary">
                RESUMEN
              </p>
              <dl className="mt-2 space-y-1.5 font-body text-sm">
                <div className="flex justify-between gap-4 text-foreground">
                  <dt className="text-secondary">Sorteo</dt>
                  <dd className="text-right">
                    #{sorteo.numero} {sorteo.titulo}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 text-foreground">
                  <dt className="text-secondary">Boletos</dt>
                  <dd className="text-right tabular-nums">
                    {selected.join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 text-foreground">
                  <dt className="text-secondary">Cantidad</dt>
                  <dd className="tabular-nums">{selected.length}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border/60 pt-1.5 font-heading text-accent">
                  <dt>Total</dt>
                  <dd className="tabular-nums">${total} MXN</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  soltarReserva();
                  setStep(promo ? "promo" : "select");
                }}
                className="btn-outline boleto flex-1 text-center text-sm"
              >
                Cambiar números
              </button>
              <button
                type="submit"
                disabled={vencido}
                className={`btn-accent boleto flex-1 text-sm ${
                  vencido ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Enviar a WhatsApp
              </button>
            </div>
          </form>
        </>
      )}

      {step === "sent" && (
        <div className="mx-auto mt-8 max-w-lg text-center">
          <div className="materialize rounded-xl border border-border bg-surface p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-heading text-xl text-white">
              Solicitud enviada
            </h2>
            <p className="mt-2 font-body text-sm text-secondary">
              Te abrimos WhatsApp con los datos de tu compra. Un asesor te
              confirma la disponibilidad y el pago.
            </p>

            <p className="mt-4 font-body text-sm text-foreground">
              <span className="text-secondary">Tus números: </span>
              <span className="font-heading tabular-nums text-white">
                {selected.join(", ")}
              </span>
            </p>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent boleto mt-6 inline-block text-sm"
              >
                Abrir WhatsApp
              </a>
            )}
            <p className="mt-2 font-body text-xs text-secondary/70">
              ¿No se abrió? Usa el botón de arriba.
            </p>

            {!userId && (
              <p className="mt-6 border-t border-border/60 pt-5 font-body text-sm text-secondary">
                <Link
                  href={`/login${volverUrl ? `?next=${encodeURIComponent(volverUrl)}` : ""}`}
                  className="font-heading text-accent underline-offset-4 hover:underline"
                >
                  Crea tu cuenta
                </Link>{" "}
                para ver tus próximas compras en Mi Perfil.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                // Keep the existing hold in place (the request is in flight with
                // an advisor); just reset the form to pick another batch.
                setSelected([]);
                setForm({ nombre: "", telefono: "", email: "" });
                setTocado({ nombre: false, telefono: false, email: false });
                setReservaId(null);
                setExpiresAt(null);
                setWaUrl(null);
                setFiltro("");
                setStep("select");
              }}
              className="btn-primary boleto mt-6"
            >
              Comprar más boletos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
