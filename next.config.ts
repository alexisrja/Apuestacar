import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.92.8.94", "169.254.83.107"],
  experimental: {
    // Habilita <ViewTransition> de React: el premio se transforma de la
    // tarjeta a la portada del sorteo, y las rutas entran según su dirección.
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
