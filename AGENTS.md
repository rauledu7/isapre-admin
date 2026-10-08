# ARQUITECTURA TÉCNICA Y ESTÁNDARES (AGENTS)

## 1. Stack Tecnológico Principal
- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript (Strict Mode)
- **Estilos:** Tailwind CSS
- **Componentes UI:** Shadcn UI + Radix UI
- **Estado Global:** Zustand
- **Base de Datos & Auth:** Supabase (PostgreSQL + RLS)
- **Visualización de Datos:** Recharts

## 2. Estructura de Directorios

```text
src/
├── app/                  # Rutas principales (dashboard, cotizador, prospectos, auth)
├── components/
│   ├── ui/               # Componentes atómicos de Shadcn (Button, Dialog, Input, Table)
│   ├── calculator/       # Simulador de 7%, comparador de planes y excedentes
│   ├── crm/              # Pipeline de prospectos, tarjetas de seguimiento y notas
│   └── layout/           # Sidebar, Navbar del asesor, Header con valor UF actual
├── config/               # Constantes de Isapres, tramos, factores y valores UF (`isapres.ts`)
├── hooks/                # Hooks personalizados (useProspects, useCalculator)
├── lib/
│   ├── calculators/      # Algoritmos de 7% legal, cálculo de precio final UF/CLP
│   └── supabase/         # Clientes y consultas de base de datos
├── store/                # Estados de Zustand para el flujo activo de cotización
└── types/                # Interfaces de TypeScript (Prospecto, Plan, Carga, Isapre)
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
