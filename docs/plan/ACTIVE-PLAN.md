# PLAN ACTIVO: IsapreAssistant - Copiloto para Asesores de Isapre

## Estado: [IN_PROGRESS]

### Etapa 1: Setup, Tipos y Lógica de Cálculo Core
- [x] Inicializar proyecto Next.js (App Router), TypeScript, Tailwind CSS y Shadcn UI.
- [x] Crear archivo de tipos `src/types/isapre.ts` (Prospecto, Plan, Carga, Cotización).
- [x] Implementar motor de cálculo puro en `src/lib/calculators/isapreMath.ts` (conversión CLP a 7% UF, tope imponible, cálculo de excedentes/diferencia).
- Tope imponible 2026: 90,0 UF (7% máx. 6,3 UF) y Tabla de Factores Única cargados en `src/config/isapres.ts`.

### Etapa 2: Layout Base y Cotizador Express (MVP)
- [x] Diseñar Sidebar funcional y Header con indicador del valor de la UF personalizable.
- [x] Crear formulario del **Cotizador Rápido** (Sueldo, Edad, Cargas, Isapre actual).
- [x] Construir panel de resultados interactivo: Muestra 7% en UF vs. alternativas de planes y si genera excedentes o adicional.
- [~] Carga de planes desde PDF: **postergada** hasta definir el formato de los PDF y los datos a extraer.

### Etapa 3: Embudo de Prospectos (CRM Liviano)
- [x] Configurar cliente de Supabase (Auth email + contraseña, RLS por asesor, migración en `supabase/migrations/`).
- [x] Crear vista de Kanban / Lista de Prospectos con 8 etapas editables por el asesor.
- [x] Ficha de prospecto con historial de cotizaciones asociadas y notas rápidas.
- [x] "Guardar en prospecto" desde el Cotizador y "Cotizar" desde la ficha.
- [ ] Verificación end-to-end contra el proyecto Supabase real (pendiente de configurar `.env.local` y correr la migración).

### Etapa 4: Herramienta de Cierre (Exportación y WhatsApp)
- [ ] Implementar generador de mensaje con formato predeterminado para WhatsApp con la propuesta económica.
- [ ] Crear vista imprimible / exportable a PDF con el resumen comparativo para el cliente final.

### Etapa 5: Refinamiento de UX y Pruebas
- [ ] Agregar filtros de búsqueda rápida de prospectos por RUT o Nombre.
- [ ] Validaciones estricta con TypeScript y revisión de respuestas responsivas en celulares (los asesores usan mucho el móvil en terreno).