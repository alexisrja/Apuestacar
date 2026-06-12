import { getResultados } from "@/lib/resultados";
import ResultadoManager from "@/components/admin/resultado-manager";

export default async function AdminResultadosPage() {
  const resultados = await getResultados();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-white">
          Gestión de <span className="text-gradient">Resultados</span>
        </h2>
      </div>
      <p className="mt-1 font-body text-sm text-secondary">
        Agrega los ganadores de sorteos anteriores para mostrarlos en la página
        de resultados.
      </p>
      <div className="mt-6">
        <ResultadoManager resultados={resultados} />
      </div>
    </div>
  );
}
