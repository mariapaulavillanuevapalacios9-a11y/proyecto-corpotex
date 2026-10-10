import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "CORPOTEX",
  description: "Producción, abastecimiento y configurador 3D de Grupo DYC (Unicrack y Corpotex)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700&family=Figtree:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Anton&family=Pacifico&display=swap"
        />
      </head>
      <body>
        {children}
        {/* Three.js r128 para el visor 3D (se carga antes que la app) */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
