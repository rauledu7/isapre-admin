# PLAN ACTIVO: IsapreAssistant

## Estado: [IN_PROGRESS]

El plan anterior (etapas 1 a 5) quedó en `PLAN-EJECUTADO-v1.md`.

### Paso 1: Identidad visual y dashboard
- [x] Tema SaaS: contenido Indigo/Slate claro y sidebar Slate oscuro.
- [x] Paleta por estado: éxito `#10b981`, pendiente `#f59e0b`, proceso `#3b82f6`, prioridad `#8b5cf6`, alerta `#ef4444`.
- [x] Dashboard principal con el embudo en gráfico (Recharts).

### Paso 2: Metas y calendario de seguimientos
- [x] Meta de UF cerradas al mes y meta de contratos / afiliados, configurables en el perfil del asesor.
- [x] Fechas de contacto o seguimiento por prospecto, sincronizadas con un calendario.
- La UF cerrada es el precio del plan afiliado, ingresado en la ficha. El contrato cuenta en el mes en que el prospecto pasa a una etapa ganada. El calendario lee `proximo_contacto`; no hay una agenda aparte.
- [x] Verificación contra Supabase (correr `supabase/migrations/20261008220000_paso2_metas_calendario.sql`).

### Paso 3: Importación masiva (CSV / XLS)
- [ ] Modal de carga con drag-and-drop.
- [ ] Campos: Nombre, RUT, Teléfono, Email, Renta imponible, Isapre actual, Cargas, Etapa inicial.
- [ ] Validación con reporte previo: ignorar filas corruptas o sin nombre y teléfono.
