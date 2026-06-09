"use client";

import { useState } from "react";
import type { Sorteo } from "@/app/data/sorteos";

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
    const message = `¡Hola! Quiero comprar boletos del *Sorteo #${sorteo.numero} — ${sorteo.titulo}* (premio: ${sorteo.premio}).%0A%0A📋 *Datos del comprador:*%0A👤 Nombre: ${encodeURIComponent(form.nombre)}%0A📞 Teléfono: ${encodeURIComponent(form.telefono)}%0A✉️ Email: ${encodeURIComponent(form.email)}%0A%0A🎫 *Números seleccionados:* ${encodeURIComponent(numbersList)}%0A💰 *Total: $${total} USD*%0A%0A¡Gracias!`;

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
        <p className="mt-2 font-heading text-sm tracking-wider text-[#A78BFA]">
          SORTEO #{sorteo.numero} · {sorteo.titulo}
        </p>
        <div className="neon-line" />
        {step === "select" && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-[#A78BFA]">
            Selecciona tus números de la suerte. Cada boleto cuesta{" "}
            <span className="font-heading text-[#F43F5E]">
              ${sorteo.precioBoleto} USD
            </span>
            .
          </p>
        )}
        {step === "form" && (
          <p className="mx-auto mt-4 max-w-lg font-body text-sm text-[#A78BFA]">
            Ingresa tus datos para confirmar la compra de{" "}
            <span className="font-heading text-[#7C3AED]">
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
                      ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                      : "border-[#4C1D95] bg-[#27273B] text-[#E2E8F0] hover:border-[#7C3AED] hover:bg-[#7C3AED]/20"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <div className="sticky bottom-4 mt-8 rounded-xl border border-[#4C1D95] bg-[#1A1A35]/95 p-6 backdrop-blur-md">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-heading text-sm text-[#A78BFA]">BOLETOS</p>
                <p className="font-heading text-2xl text-white">
                  {selected.length}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-sm text-[#A78BFA]">TOTAL</p>
                <p className="font-heading text-3xl text-[#F43F5E] glow-text">
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
          className="mx-auto mt-8 max-w-lg rounded-xl border border-[#4C1D95] bg-[#1A1A35] p-6 sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="nombre"
                className="block font-heading text-sm text-[#A78BFA]"
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
                className="mt-1.5 w-full rounded-lg border border-[#4C1D95] bg-[#27273B] px-4 py-3 font-body text-sm text-white placeholder-[#A78BFA]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label
                htmlFor="telefono"
                className="block font-heading text-sm text-[#A78BFA]"
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
                className="mt-1.5 w-full rounded-lg border border-[#4C1D95] bg-[#27273B] px-4 py-3 font-body text-sm text-white placeholder-[#A78BFA]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block font-heading text-sm text-[#A78BFA]"
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
                className="mt-1.5 w-full rounded-lg border border-[#4C1D95] bg-[#27273B] px-4 py-3 font-body text-sm text-white placeholder-[#A78BFA]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#4C1D95]/50 bg-[#27273B]/50 p-4">
            <p className="font-heading text-xs text-[#A78BFA]">RESUMEN</p>
            <div className="mt-2 space-y-1 font-body text-sm">
              <p className="flex justify-between text-[#E2E8F0]">
                <span>Sorteo</span>
                <span>
                  #{sorteo.numero} {sorteo.titulo}
                </span>
              </p>
              <p className="flex justify-between text-[#E2E8F0]">
                <span>Boletos</span>
                <span>{selected.join(", ")}</span>
              </p>
              <p className="flex justify-between text-[#E2E8F0]">
                <span>Cantidad</span>
                <span>{selected.length}</span>
              </p>
              <p className="flex justify-between font-heading text-[#F43F5E]">
                <span>Total</span>
                <span>${total} USD</span>
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
          <div className="rounded-xl border border-[#4C1D95] bg-[#1A1A35] p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7C3AED]/20">
              <svg
                className="h-8 w-8 text-[#7C3AED]"
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
            <p className="mt-2 font-body text-sm text-[#A78BFA]">
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
