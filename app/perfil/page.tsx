import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileActions from "@/components/profile-actions";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? "";
  const initials = (displayName || user.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = new Date(user.created_at).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="page-fade">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#1E3A8A] bg-gradient-to-br from-[#2563EB] to-[#22D3EE] font-heading text-2xl text-[#0A0F1E]">
            {initials}
          </div>
          <h1 className="mt-4 font-heading text-3xl text-white">
            Mi <span className="text-gradient">Perfil</span>
          </h1>
          <div className="neon-line" />
        </div>

        <div className="mt-6 rounded-xl border border-[#1E3A8A] bg-[#111A2E] p-6 sm:p-8">
          <dl className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-heading text-sm text-[#38BDF8]">Correo</dt>
              <dd className="font-body text-sm text-white">{user.email}</dd>
            </div>
            <div className="h-px bg-[#1E3A8A]/60" />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-heading text-sm text-[#38BDF8]">
                Miembro desde
              </dt>
              <dd className="font-body text-sm text-white">{memberSince}</dd>
            </div>
          </dl>

          <ProfileActions initialName={displayName} />
        </div>
      </div>
    </div>
  );
}
