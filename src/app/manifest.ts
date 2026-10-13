import type { MetadataRoute } from "next";

// PWA instalável pelo menu do navegador, sem service worker e sem modo offline (ADR-002, D2).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saldo Futuro",
    short_name: "Saldo Futuro",
    description: "Gestão de investimentos pessoais.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    theme_color: "#0b2a55", // token `primary` do DESIGN.md
    background_color: "#ffffff", // token `surface`
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
