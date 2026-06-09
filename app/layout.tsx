import type { Metadata } from "next";
import { Russo_One, Chakra_Petch } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Apuestacar - La Rifa Más Emocionante",
  description:
    "Participa en las mejores rifas con premios increíbles. Compra tus boletos y gana grandes premios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${russoOne.variable} ${chakraPetch.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col scanline">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
