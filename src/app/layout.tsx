import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";

import { envPublico } from "@/lib/supabase/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IsapreAssistant",
  description: "Copiloto comercial para asesores de Isapre",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  const publico = JSON.stringify(envPublico()).replaceAll("<", "\\u003c");
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full">
        <script dangerouslySetInnerHTML={{ __html: `window.__ISAPRE_ENV__=${publico}` }} />
        {children}
      </body>
    </html>
  );
}
