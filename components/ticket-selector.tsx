"use client";

import { useEffect, useState } from "react";
import type { Sorteo } from "@/app/data/sorteos";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

interface FormData {
  nombre: string;
  telefono: string;
  email: string;
}

export default function TicketSelector({ sorteo }: { sorteo: Sorteo }) {
  const allNumbers = Array.from({ length: sorteo.totalBoletos }, (_, i) =>
    String(i + 1).padStart(3, "0"),
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "form" | "sent">("select");
  const [form, setForm] = useState<FormData>({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Identify the signed-in user (if any) to link the purchase and prefill data.
  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserId(user.id);
      setForm((prev) => ({
        ...prev,
        nombre:
          prev.nombre ||
          ((user.user_metadata?.full_name as string | undefined) ?? ""),
        email: prev.email || (user.email ?? ""),
      }));
    });
  }, []);

  const toggleNumber = (num: string) => {
    if (step !== "select") return;
    setSelected((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    );
  };

  const total = selected.length * sorteo.precioBoleto;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numbersList = selected.join(", ");
    const message = `¡Hola! Quiero comprar boletos del *Sorteo #${sorteo.numero} — ${sorteo.titulo}* (premio: ${sorteo.premio}).%0A%0A📋 *Datos del comprador:*%0A👤 Nombre: ${encodeURIComponent(form.nombre)}%0A📞 Teléfono: ${encodeURIComponent(form.telefono)}%0A✉️ Email: ${encodeURIComponent(form.email)}%0A%0A🎫 *Números seleccionados:* ${encodeURIComponent(numbersList)}%0A💰 *Total: $${total} MXN*%0A%0A¡Gracias!`;

    // Persist the purchase request for signed-in users so it shows in "Mis
    // Boletos". RLS guarantees the row is owned by this user. Fire-and-forget —
    // never block the WhatsApp hand-off on the DB write.
    if (userId && supabaseConfigured) {
      const supabase = createClient();
      void supabase.from("compras").insert({
        user_id: userId,
        sorteo_id: sorteo.id,
        sorteo_numero: sorteo.numero,
        sorteo_titulo: sorteo.titulo,
        sorteo_premio: sorteo.premio,
        numeros: selected,
        cantidad: selected.length,
        total,
      });
    }

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");

    setStep("sent");
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasSelection = selected.length > 0;

  return (
    <div className="page-fade">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
          {step === "select" && "Elige tus "}
          {step === "form" && "Tus Datos "}
          {step === "sent" && "Solicitud "}
          <span className="text-gradient">
            {step === "select" && "Números"}
            {step === "form" && "Personales"}
            {step === "sent" && "Enviada"}
          </span>
        </h1>
        <p className="mt-2 font-heading text-sm tracking-wider text-secondary">
          SORTEO #{sorteo.numero} · {sorteo.titulo}
        </p>
        <div className="neon-line" />
        {step === "select" && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
            Selecciona tus números de la suerte. Cada boleto cuesta{" "}
            <span className="font-heading text-accent">
              ${sorteo.precioBoleto} MXN
            </span>
            .
          </p>
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
      </div>

      {step === "select" && (
        <>
          <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {allNumbers.map((num) => {
              const isSelected = selected.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleNumber(num)}
                  aria-pressed={isSelected}
                  aria-label={`Número ${num}${isSelected ? ", seleccionado" : ""}`}
                  className={`flex h-12 items-center justify-center rounded-lg border font-heading text-sm transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                      : "border-border bg-muted text-foreground hover:border-primary hover:bg-primary/20"
                  }`}
                >
                  {num}
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
              </div>
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => setStep("form")}
                className={`btn-accent w-full sm:w-auto ${
                  !hasSelection ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        </>
      )}

      {step === "form" && (
        <form
          onSubmit={handleFormSubmit}
          className="mx-auto mt-8 max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8"
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
              onClick={() => setStep("select")}
              className="btn-outline flex-1 text-center text-sm"
            >
              Atrás
            </button>
            <button type="submit" className="btn-accent flex-1 text-sm">
              Enviar a WhatsApp
            </button>
          </div>
        </form>
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
                setSelected([]);
                setForm({ nombre: "", telefono: "", email: "" });
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
