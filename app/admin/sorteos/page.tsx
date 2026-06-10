import { getSorteos } from "@/lib/sorteos";
import SorteoManager from "@/components/admin/sorteo-manager";

export default async function AdminSorteosPage() {
  const sorteos = await getSorteos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-white">
          Gestión de <span className="text-gradient">Sorteos</span>
        </h2>
      </div>
      <p className="mt-1 font-body text-sm text-[#38BDF8]">
        Crea, edita y elimina los sorteos visibles en el sitio.
      </p>
      <div className="mt-6">
        <SorteoManager sorteos={sorteos} />
      </div>
    </div>
  );
}
