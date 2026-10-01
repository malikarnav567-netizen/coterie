import type { Metadata } from "next";
import { Cormorant_Garamond, Cinzel, EB_Garamond } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cinzel",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-ebgaramond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coterie — Lux Mea",
  description: "A private creative commons for writers, poets, and readers, built around your campus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable} ${ebGaramond.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
