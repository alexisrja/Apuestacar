"use client";

import { useEffect, useState, useTransition } from "react";
import type { Sorteo } from "@/app/data/sorteos";
import {
  createClient,
  isInvalidRefreshTokenError,
  supabaseConfigured,
} from "@/lib/supabase/client";
import { PROMOS, calcularTotal, getPromo } from "@/lib/promos";
import { liberarReserva, reservarBoletos } from "@/app/boletos/actions";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

interface FormData {
  nombre: string;
  telefono: string;
  email: string;
}

export default function TicketSelector({
  sorteo,
  takenNumbers = [],
  promoCantidad,
}: {
  sorteo: Sorteo;
  takenNumbers?: string[];
  promoCantidad?: number;
}) {
  const allNumbers = Array.from({ length: sorteo.totalBoletos }, (_, i) =>
    String(i + 1).padStart(3, "0"),
  );

  // Promo válida sólo si la cantidad existe en el catálogo de promos.
  const promo = promoCantidad ? getPromo(promoCantidad) : null;
  const limite = promo?.cantidad ?? null;

  const [selected, setSelected] = useState<string[]>([]);
  // Numbers discovered as taken locally (a reservation collided with a fresh
  // hold). Merged with the server-provided list below.
  const [extraTaken, setExtraTaken] = useState<string[]>([]);
  const taken = [...new Set([...takenNumbers, ...extraTaken])];
  const [cantidadAleatoria, setCantidadAleatoria] = useState("5");
  const [step, setStep] = useState<
    "promo" | "select" | "form" | "sent"
  >(promo ? "promo" : "select");
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Identify the signed-in user (if any) to link the purchase and prefill data.
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
        setUserName(
          (user.user_metadata?.full_name as string | undefined) ?? null,
        );
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

  const toggleNumber = (num: string) => {
    if (step !== "select") return;
    if (taken.includes(num)) return;
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
    const disponibles = allNumbers.filter((x) => !taken.includes(x));
    const barajados = [...disponibles].sort(() => Math.random() - 0.5);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numbersList = selected.join(", ");
    // Mensaje en texto plano con saltos de línea reales; se codifica entero al
    // final. Codificar por partes deja sin escapar caracteres como "#", que
    // WhatsApp/URL interpreta como fragmento y trunca el mensaje.
    const message = `¡Hola! Quiero comprar boletos del *Sorteo #${sorteo.numero} — ${sorteo.titulo}* (premio: ${sorteo.premio}).\n\n📋 *Datos del comprador:*\n👤 Nombre: ${form.nombre}\n📞 Teléfono: ${form.telefono}\n✉️ Email: ${form.email}\n\n🎫 *Números seleccionados:* ${numbersList}\n💰 *Total: $${total} MXN*\n\n¡Gracias!`;

    // Persist the purchase request for signed-in users so it shows in "Mis
    // Boletos". RLS guarantees the row is owned by this user. Fire-and-forget —
    // never block the WhatsApp hand-off on the DB write.
    if (userId && supabaseConfigured) {
      const supabase = createClient();
      supabase.from("compras").insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        sorteo_id: sorteo.id,
        sorteo_numero: sorteo.numero,
        sorteo_titulo: sorteo.titulo,
        sorteo_premio: sorteo.premio,
        numeros: selected,
        cantidad: selected.length,
        total,
      }).then(({ error }) => {
        if (error) console.error("Error al guardar compra:", error);
      });
    }

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );

    setStep("sent");
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Con promo hay que completar exactamente el paquete; sin promo basta con 1.
  const puedeAvanzar = limite
    ? selected.length === limite
    : selected.length > 0;

  return (
    <div className="page-fade">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
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
        <div className="neon-line" />
        {step === "select" && promo && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
            Selecciona{" "}
            <span className="font-heading text-accent">
              {selected.length} de {promo.cantidad}
            </span>{" "}
            boletos de tu paquete.
          </p>
        )}
        {step === "select" && !promo && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
            Selecciona tus números de la suerte. Cada boleto cuesta{" "}
            <span className="font-heading text-accent">
              ${sorteo.precioBoleto} MXN
            </span>
            .
          </p>
        )}
        {step === "select" && !promo && (
          <div className="mx-auto mt-4 flex max-w-lg flex-wrap items-center justify-center gap-2">
            {PROMOS.map((p) => {
              const activa = selected.length === p.cantidad;
              return (
                <span
                  key={p.cantidad}
                  className={`rounded-full border px-3 py-1 font-heading text-xs transition-colors ${
                    activa
                      ? "border-accent bg-accent/20 text-accent glow-text"
                      : "border-border bg-muted text-secondary"
                  }`}
                >
                  🎁 {p.cantidad} boletos por ${p.precio} MXN
                </span>
              );
            })}
          </div>
        )}
        {step === "form" && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
            Ingresa tus datos para confirmar la compra de{" "}
            <span className="font-heading text-primary">
              {selected.length} boletos
            </span>
            .
          </p>
        )}
        {step === "promo" && promo && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
            Paquete de{" "}
            <span className="font-heading text-accent">
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
            className="group rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/15 to-surface p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary"
          >
            <div className="text-4xl">✋</div>
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
            className="group rounded-2xl border border-accent/60 bg-gradient-to-br from-accent/15 to-surface p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="text-4xl">🎲</div>
            <p className="mt-3 font-heading text-lg text-white">
              Números aleatorios
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
                  inputMode="numeric"
                  aria-label="Cantidad de boletos aleatorios"
                  value={cantidadAleatoria}
                  onChange={(e) => setCantidadAleatoria(e.target.value)}
                  className="w-20 rounded-lg border border-border bg-muted px-3 py-2 text-center font-heading text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const disponibles = allNumbers.filter(
                      (x) => !taken.includes(x),
                    ).length;
                    const n = Math.min(
                      Math.max(1, Math.floor(Number(cantidadAleatoria) || 0)),
                      disponibles,
                    );
                    pickRandom(n);
                  }}
                  className="btn-accent text-sm whitespace-nowrap"
                >
                  🎲 Aleatorios
                </button>
              </div>
            </div>
          )}

          {reservaError && (
            <p className="mx-auto mt-6 max-w-lg rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center font-body text-sm text-[#FCA5A5]">
              {reservaError}
            </p>
          )}

          <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {allNumbers.map((num) => {
              const isSelected = selected.includes(num);
              const isTaken = taken.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  disabled={isTaken}
                  onClick={() => toggleNumber(num)}
                  aria-pressed={isSelected}
                  aria-label={`Número ${num}${isSelected ? ", seleccionado" : ""}${isTaken ? ", no disponible" : ""}`}
                  className={`flex h-12 items-center justify-center rounded-lg border font-heading text-sm transition-all duration-200 ${
                    isTaken
                      ? "cursor-not-allowed border-destructive/40 bg-destructive/10 text-[#FCA5A5] line-through"
                      : isSelected
                        ? "active:scale-95 border-primary bg-primary text-white shadow-[0_0_15px rgba(37,99,235,0.4)]"
                        : "active:scale-95 border-border bg-muted text-foreground hover:border-primary hover:bg-primary/20"
                  }`}
                >
                  {isTaken ? "✗" : num}
                </button>
              );
            })}
          </div>

          <div className="sticky bottom-4 mt-8 rounded-xl border border-border bg-surface/95 p-6 backdrop-blur-md">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-heading text-sm text-secondary">BOLETOS</p>
                <p className="font-heading text-2xl text-white">
                  {selected.length}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-sm text-secondary">TOTAL</p>
                <p className="font-heading text-3xl text-accent glow-text">
                  ${total}
                </p>
                {promoActiva && ahorro > 0 && (
                  <p className="font-heading text-xs text-primary">
                    ¡Promo aplicada! Ahorras ${ahorro}
                  </p>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {promo && (
                  <button
                    type="button"
                    onClick={() => pickRandom(promo.cantidad)}
                    className="btn-outline w-full text-sm sm:w-auto"
                  >
                    🎲 Sorpréndeme
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
          </div>
        </>
      )}

      {step === "form" && (
        <>
        {expiresAt && (
          <div className="mx-auto mt-8 flex max-w-lg items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-center">
            <span className="text-lg">⏳</span>
            <p className="font-body text-sm text-secondary">
              Apartamos tus boletos por{" "}
              <span className="font-heading text-accent">
                {String(Math.floor(restante / 60000)).padStart(2, "0")}:
                {String(Math.floor((restante % 60000) / 1000)).padStart(2, "0")}
              </span>
              . Confirma tu pago antes de que termine o volverán a estar
              disponibles.
            </p>
          </div>
        )}
        <form
          onSubmit={handleFormSubmit}
          className="mx-auto mt-6 max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="nombre"
                className="block font-heading text-sm text-secondary"
              >
                Nombre Completo
              </label>
              <input
                id="nombre"
                type="text"
                required
                autoComplete="name"
                value={form.nombre}
                onChange={(e) => updateForm("nombre", e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="mt-1.5 w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-sm text-white placeholder-secondary/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="telefono"
                className="block font-heading text-sm text-secondary"
              >
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                required
                autoComplete="tel"
                value={form.telefono}
                onChange={(e) => updateForm("telefono", e.target.value)}
                placeholder="Ej: 5512345678"
                className="mt-1.5 w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-sm text-white placeholder-secondary/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block font-heading text-sm text-secondary"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="Ej: correo@ejemplo.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-sm text-white placeholder-secondary/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border/50 bg-muted/50 p-4">
            <p className="font-heading text-xs text-secondary">RESUMEN</p>
            <div className="mt-2 space-y-1 font-body text-sm">
              <p className="flex justify-between text-foreground">
                <span>Sorteo</span>
                <span>
                  #{sorteo.numero} {sorteo.titulo}
                </span>
              </p>
              <p className="flex justify-between text-foreground">
                <span>Boletos</span>
                <span>{selected.join(", ")}</span>
              </p>
              <p className="flex justify-between text-foreground">
                <span>Cantidad</span>
                <span>{selected.length}</span>
              </p>
              <p className="flex justify-between font-heading text-accent">
                <span>Total</span>
                <span>${total} MXN</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                soltarReserva();
                setStep(promo ? "promo" : "select");
              }}
              className="btn-outline flex-1 text-center text-sm"
            >
              Atrás
            </button>
            <button type="submit" className="btn-accent flex-1 text-sm">
              Enviar a WhatsApp
            </button>
          </div>
        </form>
        </>
      )}

      {step === "sent" && (
        <div className="mx-auto mt-8 max-w-lg text-center">
          <div className="rounded-xl border border-border bg-surface p-8">
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
              ¡Solicitud Enviada!
            </h2>
            <p className="mt-2 font-body text-sm text-secondary">
              Te redirigimos a WhatsApp con los datos de tu compra. Un asesor te
              confirmará la disponibilidad de los números seleccionados.
            </p>
            <button
              type="button"
              onClick={() => {
                // Keep the existing hold in place (the request is in flight with
                // an advisor); just reset the form to pick another batch.
                setSelected([]);
                setForm({ nombre: "", telefono: "", email: "" });
                setReservaId(null);
                setExpiresAt(null);
                setStep("select");
              }}
              className="btn-primary mt-6"
            >
              Comprar de Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
