import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { siteUrl, siteName, siteDescription } from "@/lib/seo";

// Títulos y etiquetas. Es la única cara con personalidad del sitio; el cuerpo
// usa la del sistema, que ya trae tamaño óptico y respeta el tamaño de texto
// que el usuario configuró en su teléfono.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

// Cifras: precios, números de boleto, cronómetros y capacidad. Tabular, para
// que nada salte cuando el valor cambia cada segundo.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - La Rifa Más Emocionante`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "rifas",
    "rifas online",
    "comprar boletos",
    "sorteos",
    "premios",
    "ganar premios",
    "rifa de autos",
    "rifa de motos",
    "RIFAS JAPS",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName,
    title: `${siteName} - La Rifa Más Emocionante`,
    description: siteDescription,
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - La Rifa Más Emocionante`,
    description: siteDescription,
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteName,
              url: siteUrl,
              logo: `${siteUrl}/icon.png`,
              description: siteDescription,
            }),
          }}
        />
        {/* La barra y el pie quedan fuera de la transición: son el ancla
            espacial. Lo que se mueve es el contenido, no el navegador. */}
        <Navbar />
        <main className="flex-1">
          <ViewTransition
            enter={{
              "nav-forward": "nav-forward",
              "nav-back": "nav-back",
              default: "none",
            }}
            exit={{
              "nav-forward": "nav-forward",
              "nav-back": "nav-back",
              default: "none",
            }}
            default="none"
          >
            {children}
          </ViewTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
