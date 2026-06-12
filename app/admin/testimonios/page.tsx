import { getTestimonios } from "@/lib/testimonios";
import TestimonioManager from "@/components/admin/testimonio-manager";

export default async function AdminTestimoniosPage() {
  const testimonios = await getTestimonios();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-white">
          Gestión de <span className="text-gradient">Testimonios</span>
        </h2>
      </div>
      <p className="mt-1 font-body text-sm text-secondary">
        Agrega los testimonios de ganadores que aparecen en la página principal
        y en resultados.
      </p>
      <div className="mt-6">
        <TestimonioManager testimonios={testimonios} />
      </div>
    </div>
  );
}
