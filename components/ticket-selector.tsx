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
      className="flex max-w-md items-center gap-2"
      aria-label="Progreso de la compra"
    >
      {PASOS.map((nombre, i) => {
        const hecho = i < actual;
        const activo = i === actual;
        return (
          <li key={nombre} className="flex flex-1 flex-col gap-2">
            <span
              className={`h-[3px] rounded-full transition-colors duration-200 ${
                hecho || activo ? "bg-primary" : "bg-border"
              }`}
            />
            <span
              className={`eyebrow transition-colors duration-200 ${
                activo ? "text-white" : hecho ? "" : "opacity-50"
              }`}
              aria-current={activo ? "step" : undefined}
            >
              {i + 1}. {nombre}
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
  // Último número tomado: recibe el golpe de confirmación una sola vez.
  const [pulso, setPulso] = useState<string | null>(null);
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
      if (prev.includes(num)) {
        setPulso(null);
        return prev.filter((n) => n !== num);
      }
      // En modo promo no se permite exceder la cantidad del paquete.
      if (limite && prev.length >= limite) return prev;
      // Marca cuál acaba de tomarse para que ese —y sólo ese— dé el golpe.
      setPulso(num);
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

  // 48px de alto y texto de 16px: objetivo táctil cómodo y sin auto-zoom en iOS.
  const inputBase =
    "mt-1.5 h-12 w-full rounded-xl border bg-muted px-4 text-base text-white placeholder-secondary/60 outline-none transition-colors";
  const inputEstado = (campo: keyof FormData) =>
    tocado[campo] && errores[campo]
      ? "border-destructive focus:border-destructive"
      : "border-border focus:border-primary";
  const labelBase = "block text-sm font-medium text-foreground";
  const errorBase = "mt-1.5 text-xs text-destructive";

  return (
    <div className="page-fade">
      <div>
        <p className="eyebrow">
          {[`Sorteo ${sorteo.numero}`, sorteo.titulo].filter(Boolean).join(" · ")}
        </p>
        <h1 className="display mt-3 text-3xl text-white sm:text-4xl">
          {step === "promo" && "Elige cómo armar tu paquete"}
          {step === "select" && "Elige tus números"}
          {step === "form" && "Tus datos"}
          {step === "sent" && "Solicitud enviada"}
        </h1>

        <div className="mt-6">
          <StepRail step={step} />
        </div>

        {step === "select" && promo && (
          <p className="measure mt-6 text-sm text-secondary">
            Llevas{" "}
            <span className="num font-medium text-white">
              {selected.length} de {promo.cantidad}
            </span>{" "}
            boletos del paquete.
          </p>
        )}
        {step === "select" && !promo && (
          <p className="measure mt-6 text-sm text-secondary">
            Cada boleto cuesta{" "}
            <span className="num font-medium text-white">
              ${sorteo.precioBoleto}
            </span>{" "}
            MXN. Quedan{" "}
            <span className="num font-medium text-white">{disponibles}</span> de{" "}
            <span className="num">{sorteo.totalBoletos}</span> disponibles.
          </p>
        )}
        {step === "select" && !userId && (
          <p className="measure mt-2 text-sm text-secondary">
            Puedes comprar sin cuenta.{" "}
            <Link
              href={`/login${volverUrl ? `?next=${encodeURIComponent(volverUrl)}` : ""}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Inicia sesión
            </Link>{" "}
            si quieres que tus boletos queden guardados en Mi perfil.
          </p>
        )}
        {step === "select" && !promo && (
          <ul className="mt-5 flex flex-wrap items-center gap-2">
            {PROMOS.map((p) => {
              const activa = selected.length === p.cantidad;
              return (
                <li
                  key={p.cantidad}
                  className={`num rounded-full border px-3 py-1 text-xs transition-colors ${
                    activa
                      ? "border-primary bg-primary/15 text-white"
                      : "border-border bg-muted text-secondary"
                  }`}
                >
                  {p.cantidad} boletos · ${p.precio} MXN
                  {activa && <span className="ml-1.5">✓</span>}
                </li>
              );
            })}
          </ul>
        )}
        {step === "form" && (
          <p className="measure mt-6 text-sm text-secondary">
            Con estos datos te confirmamos el pago de{" "}
            <span className="num font-medium text-white">
              {selected.length}
            </span>{" "}
            {selected.length === 1 ? "boleto" : "boletos"} por WhatsApp.
          </p>
        )}
        {step === "promo" && promo && (
          <p className="measure mt-6 text-sm text-secondary">
            Paquete de{" "}
            <span className="num font-medium text-white">
              {promo.cantidad} boletos por ${promo.precio} MXN
            </span>
            . ¿Cómo quieres tus números?
          </p>
        )}
      </div>

      {step === "promo" && promo && (
        <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSelected([]);
              setStep("select");
            }}
            className="boleto card card-hover p-6 text-left"
          >
            <p className="h-section text-lg text-white">Los elijo yo</p>
            <p className="mt-2 text-sm text-secondary">
              Escoges tus {promo.cantidad} números uno por uno en la cuadrícula.
            </p>
          </button>
          <button
            type="button"
            onClick={() => apartarYAvanzar(pickRandom(promo.cantidad))}
            disabled={isReserving}
            className="boleto card card-hover p-6 text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="h-section text-lg text-white">
              {isReserving ? "Apartando…" : "Elígelos por mí"}
            </p>
            <p className="mt-2 text-sm text-secondary">
              Te asignamos {promo.cantidad} números al azar de los que quedan
              libres.
            </p>
          </button>
        </div>
      )}

      {step === "select" && (
        <>
          {!promo && (
            <div className="card mt-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary">
                ¿Sin tiempo de elegir? Te asignamos números libres al azar.
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="cantidad-aleatoria" className="sr-only">
                  Cantidad de boletos aleatorios
                </label>
                <input
                  id="cantidad-aleatoria"
                  type="number"
                  min={1}
                  max={disponibles}
                  inputMode="numeric"
                  value={cantidadAleatoria}
                  onChange={(e) => setCantidadAleatoria(e.target.value)}
                  className="num h-11 w-20 rounded-xl border border-border bg-muted px-3 text-center text-base text-white outline-none transition-colors focus:border-primary"
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
                  className="btn-primary whitespace-nowrap text-sm"
                >
                  Elegir al azar
                </button>
              </div>
            </div>
          )}

          {reservaError && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {reservaError}
            </p>
          )}

          {selected.length > 0 && (
            <div className="materialize card mt-8 p-4">
              <p className="eyebrow">
                Tus números ({selected.length}
                {limite ? ` / ${limite}` : ""})
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {selected.map((num) => (
                  <li key={num}>
                    <button
                      type="button"
                      onClick={() => toggleNumber(num)}
                      className="boleto num flex h-11 items-center gap-2 rounded-full border border-primary/60 bg-primary/15 pl-3.5 pr-3 text-sm text-white hover:border-destructive/70 hover:bg-destructive/15"
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
            <div className="mt-8">
              <label
                htmlFor="filtro-numero"
                className="block text-sm font-medium text-foreground"
              >
                Buscar un número
              </label>
              <input
                id="filtro-numero"
                type="text"
                inputMode="numeric"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Ej: 07"
                className="num mt-1.5 h-12 w-full max-w-xs rounded-xl border border-border bg-muted px-4 text-base text-white placeholder-secondary/60 outline-none transition-colors focus:border-primary"
              />
            </div>
          )}

          {visibles.length === 0 ? (
            <p className="card mt-8 p-8 text-center text-sm text-secondary">
              Ningún boleto contiene “{filtro}”.{" "}
              <button
                type="button"
                onClick={() => setFiltro("")}
                className="text-primary underline-offset-4 hover:underline"
              >
                Ver todos
              </button>
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-5 gap-2 pb-6 sm:grid-cols-8 lg:grid-cols-10">
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
                    className={`boleto num flex h-12 items-center justify-center rounded-xl border text-sm ${
                      isSelected && pulso === num ? "boleto-pop" : ""
                    } ${
                      isTaken
                        ? "cursor-not-allowed border-transparent bg-muted text-secondary/40 line-through"
                        : isSelected
                          ? "boleto-on border-primary bg-primary font-medium text-white"
                          : bloqueado
                            ? "cursor-not-allowed border-border/60 bg-muted text-secondary"
                            : "border-border bg-muted text-foreground hover:border-border-strong hover:bg-surface-hover"
                    }`}
                  >
                    {isTaken ? "✕" : num}
                  </button>
                );
              })}
            </div>
          )}

          {/* Taquilla: capa flotante bajo la que pasa la cuadrícula. */}
          <div className="taquilla sticky bottom-4 mt-8 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* La cifra se renueva al cambiar: el total no salta en
                    silencio, se ve que cambió porque tocaste un número. */}
                <div>
                  <p className="eyebrow">Boletos</p>
                  <p className="num mt-1 text-xl font-medium text-white">
                    <span key={selected.length} className="cifra-in inline-block">
                      {selected.length}
                    </span>
                    {limite ? (
                      <span className="text-secondary">/{limite}</span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Total</p>
                  <p className="num mt-1 text-2xl font-medium text-white">
                    <span key={total} className="cifra-in inline-block">
                      ${total}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {promo && (
                  <button
                    type="button"
                    onClick={() => pickRandom(promo.cantidad)}
                    className="btn-primary w-full text-sm sm:w-auto"
                  >
                    Elegir al azar
                  </button>
                )}
                <button
                  type="button"
                  disabled={!puedeAvanzar || isReserving}
                  onClick={() => apartarYAvanzar(selected)}
                  className={`btn-accent w-full sm:w-auto ${
                    !puedeAvanzar || isReserving
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {isReserving ? "Apartando…" : "Continuar"}
                </button>
              </div>
            </div>
            {promoActiva && ahorro > 0 && (
              <p className="num mt-3 text-xs text-success">
                Paquete de {promoActiva.cantidad} aplicado · ahorras ${ahorro}
              </p>
            )}
            {!puedeAvanzar && (
              <p className="mt-3 text-xs text-secondary">
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
              className={`materialize mt-8 max-w-lg rounded-xl border px-4 py-3.5 ${
                vencido || porVencer
                  ? "border-destructive/40 bg-destructive/10"
                  : "border-border bg-muted"
              }`}
              role="status"
              aria-live="polite"
            >
              {vencido ? (
                <div className="text-sm text-secondary">
                  <p className="font-medium text-destructive">
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
                    className="btn-accent mt-4 text-sm"
                  >
                    {isReserving ? "Apartando…" : "Apartar de nuevo"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-secondary">
                  Tus boletos quedan apartados{" "}
                  <span
                    className={`num font-medium ${
                      porVencer
                        ? "timer-urgent text-destructive"
                        : "text-white"
                    }`}
                  >
                    {mmss}
                  </span>{" "}
                  más. Confirma el pago antes de que termine o volverán a estar
                  disponibles.
                </p>
              )}
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            noValidate
            className="card mt-6 max-w-lg p-6 sm:p-8"
          >
            <p className="text-xs text-secondary">
              {userId ? (
                <>
                  Compra ligada a tu cuenta
                  {userEmail ? ` · ${userEmail}` : ""}. Aparecerá en Mi perfil.
                </>
              ) : (
                <>Compra como invitado. No necesitas cuenta para continuar.</>
              )}
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="nombre"
                  className={labelBase}
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
                  className={`${inputBase} ${inputEstado("nombre")}`}
                />
                {tocado.nombre && errores.nombre && (
                  <p
                    id="nombre-error"
                    role="alert"
                    className={errorBase}
                  >
                    {errores.nombre}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="telefono"
                  className={labelBase}
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
                  className={`num ${inputBase} ${inputEstado("telefono")}`}
                />
                {tocado.telefono && errores.telefono ? (
                  <p
                    id="telefono-error"
                    role="alert"
                    className={errorBase}
                  >
                    {errores.telefono}
                  </p>
                ) : (
                  <p
                    id="telefono-ayuda"
                    className="mt-1.5 text-xs text-secondary"
                  >
                    A este número te confirmamos el pago. 10 dígitos, sin lada
                    internacional.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className={labelBase}
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
                  className={`${inputBase} ${inputEstado("email")}`}
                />
                {tocado.email && errores.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className={errorBase}
                  >
                    {errores.email}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-muted p-4">
              <p className="eyebrow">Resumen</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Sorteo</dt>
                  <dd className="text-right text-foreground">
                    {sorteo.numero} · {sorteo.titulo}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Números</dt>
                  <dd className="num text-right text-foreground">
                    {selected.join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Cantidad</dt>
                  <dd className="num text-foreground">{selected.length}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-2.5 font-medium text-white">
                  <dt>Total</dt>
                  <dd className="num">${total} MXN</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  soltarReserva();
                  setStep(promo ? "promo" : "select");
                }}
                className="btn-outline flex-1 text-sm"
              >
                Cambiar números
              </button>
              <button
                type="submit"
                disabled={vencido}
                className={`btn-accent flex-1 text-sm ${
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
        <div className="mt-8 max-w-lg">
          <div className="materialize card p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15">
              <svg
                className="h-6 w-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="h-section mt-4 text-xl text-white">
              Tu solicitud salió a WhatsApp
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Abrimos WhatsApp con los datos de tu compra. Un asesor confirma la
              disponibilidad y te pasa los datos de pago.
            </p>

            <div className="mt-5 rounded-xl border border-border bg-muted p-4">
              <p className="eyebrow">Tus números</p>
              <p className="num mt-2 text-sm text-white">
                {selected.join(", ")}
              </p>
            </div>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent mt-6 w-full text-sm"
              >
                Abrir WhatsApp
              </a>
            )}
            <p className="mt-2 text-xs text-secondary">
              Si tu navegador bloqueó la ventana, entra con este botón.
            </p>

            {!userId && (
              <p className="mt-6 border-t border-border pt-5 text-sm text-secondary">
                <Link
                  href={`/login${volverUrl ? `?next=${encodeURIComponent(volverUrl)}` : ""}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Crea tu cuenta
                </Link>{" "}
                y tus próximas compras quedan guardadas en Mi perfil.
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
              className="btn-primary mt-6 w-full text-sm"
            >
              Comprar más boletos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
