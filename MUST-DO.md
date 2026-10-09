# REGLAS OBLIGATORIAS DEL NEGOCIO Y UX/UI (MUST-DO)

## 1. Sistema de Notificaciones Push & Alertas
- **Canal Push (Navegador/PWA):** Implementación de Web Push API / Service Workers (vía Firebase Cloud Messaging o Supabase Webhooks + Web Push).
- **Eventos Críticos de Notificación:**
  1. **Recordatorios de Agendamiento:** Alerta 15 minutos antes y a la hora exacta de un contacto/llamada programada en el calendario.
  2. **Avance en el Pipeline / Cierre:** Alerta cuando un prospecto cambia de etapa (ej. pasa a "Firma de FUN" o "Cerrado") o cuando lleva +5 días estancado sin gestión.
  3. **Alertas de Metas:** Notificación cuando el asesor alcanza el 50%, 80% o 100% de su meta mensual de UF.

## 2. Gestión Documental por Prospecto (Document Vault)
- **Almacenamiento:** Integración con **Supabase Storage** (Bucket privado `prospecto-documentos` protegido por RLS).
- **Tipos de Documentos Clave:** Liquidaciones de sueldo, Cédula de Identidad, Certificado de Cotizaciones (AFP), FUN firmado, Certificado de Cargas / Nacimiento.
- **Búsqueda & Acceso Rápido:** Vista centralizada `/documentos` con buscador global por RUT o Nombre, filtros por tipo de archivo e previsualización rápida en pantalla.

## 3. Integración con Google Ads (Adquisition & Tracking)
- **Fase 1 (Lectura y Tracking - Inbound):**
  - Recepción de Leads vía Webhook/API desde Landing Pages de captación.
  - Almacenamiento de parámetros UTM (`utm_source`, `utm_campaign`, `utm_kw`) por prospecto para medir qué campañas generan ventas reales.
- **Fase 2 (Google Ads API & Conversion Offline):**
  - Conexión con Google Ads API para enviar **Conversiones Offline** (cuando un prospecto pasa a "Cerrado/Ganado", notificar a Google Ads el valor de la UF para optimizar el algoritmo Smart Bidding).
  - Panel de control de rendimiento de campañas dentro de la app (Gasto, Leads, Costo por Lead y Cierres).
