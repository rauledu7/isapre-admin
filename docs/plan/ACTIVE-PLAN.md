# PLAN ACTIVO: IsapreAssistant - Copiloto para Asesores de Isapre

## Estado: [IN_PROGRESS]

### Etapa 8: Notificaciones Push & Sistema de Alertas
- [x] Configurar Service Worker y registro de suscripciones Push (Web Push con claves VAPID, sin Firebase).
- [x] Guardar la suscripción en `dispositivos_push`.
- [x] Cron `GET /api/cron/alertas` (Bearer `CRON_SECRET`, cliente service role) y revisión cada minuto con la sesión abierta.
- [x] Centro de notificaciones in-app para cambios de etapa, contactos, inactividad de 5 días y meta de UF al 50%, 80% y 100%.
- La hora del contacto es opcional. Con hora, el aviso sale 15 minutos antes y a la hora. Sin hora, un aviso el día del contacto.
- [x] Correr `supabase/migrations/20261008230000_etapa8_9_alertas_documentos.sql`. Claves VAPID en `.env.local`. El cron usa `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`.

### Etapa 9: Centro de Documentos por Cliente (Document Vault)
- [x] Bucket privado `prospecto-documentos` (el nombre de MUST-DO) con RLS por carpeta del asesor.
- [x] Tabla `documentos` (`id`, `prospecto_id`, `nombre`, `tipo_doc`, `file_path`, `mime`, `tamano_bytes`, `created_at`).
- [x] Carga drag-and-drop en la ficha: Liquidación, Cédula, Certificado AFP, FUN, Certificado de cargas y Otros.
- [x] Vista `/documentos` por RUT, nombre o tipo, con previsualización de PDF e imagen.

### Etapa 10: Integración con Google Ads & Métricas de Adquisición
- [ ] Crear endpoint de API `/api/v1/leads/webhook` para recibir prospectos automáticamente desde formularios de Google Ads o Landings.
- [ ] Captura y almacenamiento de `gclid` (Google Click ID) y UTMs en la ficha del prospecto.
- [ ] Módulo en el Dashboard: ROI de Campañas de Google Ads (Comparativa de Clics vs. Prospectos Ingresados vs. UF Cerradas).
- [ ] Configuración del envío de "Conversiones Offline" a Google Ads API al marcar un contrato como ganado.
