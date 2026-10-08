# PLAN ACTIVO: IsapreAssistant - Copiloto para Asesores de Isapre

## Estado: [IN_PROGRESS]

### Etapa 1: Setup, Tipos y Lógica de Cálculo Core
- [x] Inicializar proyecto Next.js (App Router), TypeScript, Tailwind CSS y Shadcn UI.
- [x] Crear archivo de tipos `src/types/isapre.ts` (Prospecto, Plan, Carga, Cotización).
- [x] Implementar motor de cálculo puro en `src/lib/calculators/isapreMath.ts` (conversión CLP a 7% UF, tope imponible, cálculo de excedentes/diferencia).
- Pendiente de negocio: valor oficial de `TOPE_IMPONIBLE_SALUD_UF` y Tabla de Factores (`TABLA_FACTORES`) en `src/config/isapres.ts`.

### Etapa 2: Layout Base y Cotizador Express (MVP)
- [ ] Diseñar Sidebar funcional y Header con indicador del valor de la UF personalizable.
- [ ] Crear formulario del **Cotizador Rápido** (Sueldo, Edad, Cargas, Isapre actual).
- [ ] Construir panel de resultados interactivo: Muestra 7% en UF vs. alternativas de planes y si genera excedentes o adicional.

### Etapa 3: Embudo de Prospectos (CRM Liviano)
- [ ] Configurar cliente de Supabase (o Mock Store con Zustand en Fase 1) para guardar prospectos.
- [ ] Crear vista de Kanban / Lista de Prospectos con estados (*Nuevo, Cotizado, Firma FUN, Cerrado*).
- [ ] Ficha de prospecto con historial de cotizaciones asociadas y notas rápidas.

### Etapa 4: Herramienta de Cierre (Exportación y WhatsApp)
- [ ] Implementar generador de mensaje con formato predeterminado para WhatsApp con la propuesta económica.
- [ ] Crear vista imprimible / exportable a PDF con el resumen comparativo para el cliente final.

### Etapa 5: Refinamiento de UX y Pruebas
- [ ] Agregar filtros de búsqueda rápida de prospectos por RUT o Nombre.
- [ ] Validaciones estricta con TypeScript y revisión de respuestas responsivas en celulares (los asesores usan mucho el móvil en terreno).