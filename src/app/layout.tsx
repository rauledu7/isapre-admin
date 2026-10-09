import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";

import { MARCA, MARCA_DESCRIPCION } from "@/config/marca";
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
  title: { default: MARCA, template: `%s · ${MARCA}` },
  description: MARCA_DESCRIPCION,
  applicationName: MARCA,
};

async function VariablesPublicas() {
  await connection();
  const publico = JSON.stringify(envPublico()).replaceAll("<", "\\u003c");
  return <script dangerouslySetInnerHTML={{ __html: `window.__ISAPRE_ENV__=${publico}` }} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full">
        <Suspense fallback={null}>
          <VariablesPublicas />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
