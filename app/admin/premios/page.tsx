import { getSorteos } from "@/lib/sorteos";
import PremioManager from "@/components/admin/premio-manager";

export default async function AdminPremiosPage() {
  const sorteos = await getSorteos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-white">
          Gestión de <span className="text-gradient">Premios</span>
        </h2>
      </div>
      <p className="mt-1 font-body text-sm text-secondary">
        Administra las imágenes y descripciones que se muestran en la página de
        premios. Cada sorteo genera un premio automáticamente.
      </p>
      <div className="mt-6">
        <PremioManager sorteos={sorteos} />
      </div>
    </div>
  );
}
