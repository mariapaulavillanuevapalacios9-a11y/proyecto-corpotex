"use client";

import Script from "next/script";
import { MARKUP } from "./markup";

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: MARKUP }} />
      {/* Toda la lógica de la app: login, roles, pedidos, abastecimiento, 3D, precios */}
      <Script src="/dyc-app.js" strategy="afterInteractive" />
    </>
  );
}
