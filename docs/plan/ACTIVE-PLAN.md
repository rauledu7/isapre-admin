# PLAN ACTIVO: IsapreAssistant - Copiloto para Asesores de Isapre

## Estado: [IN_PROGRESS]

### Etapa 11: Motor de Suscripciones, Planes & Trial de 7 Días
- [x] **Esquema de Base de Datos en Supabase:**
  - Crear tabla `planes` (`id`, `nombre`, `precio_mensual_clp`, `precio_trimestral_clp`, `precio_anual_clp`, `mp_plan_id`).
  - Crear tabla `suscripciones` (`id`, `perfil_id`, `plan_id`, `estado` ['trialing', 'active', 'past_due', 'canceled'], `fecha_inicio`, `fecha_fin_trial`, `fecha_proximo_pago`, `mp_preapproval_id`).
- [x] **Lógica de Trial Automático:**
  - Al registrarse un asesor (trigger Supabase Auth), asignar `fecha_fin_trial = now() + 7 days` y `estado = trialing`.
- [x] **Guardia de Navegación & Paywall:**
  - Hook `useSubscription()` para verificar validez del trial/suscripción.
  - Vista `/suscripcion` con el selector de Planes (Mensual, Trimestral, Anual) e integrador del Checkout de Mercado Pago (el botón de pago se conecta en la Etapa 12).
- [x] **Planes y acceso por nivel:** Básico, Profesional y Full con precios de referencia (trimestral -10%, anual -20%). Bloqueo en proxy, RLS (`plan_permite`) y ocultando en la interfaz.

### Etapa 12: Integración Directa con Mercado Pago (Pagos & Webhooks)
- [x] Instalar SDK de Mercado Pago (`npm install mercadopago`).
- [x] Configurar variables de entorno (`MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `APP_URL`). Pendiente: cargar los valores y probar con credenciales de prueba.
- [x] Crear API Route `/api/v1/checkout/mercadopago` para generar el enlace de suscripción / preferencia de pago.
- [x] Crear Webhook handler `/api/v1/webhooks/mercadopago`:
  - Escuchar eventos `subscription_preapproval` / `payment.created`.
  - Actualizar el estado de la suscripción a `active` y actualizar `fecha_proximo_pago` en Supabase al recibir un pago aprobado.
  - Manejar pagos rechazados enviando la suscripción a `past_due`.
- [x] Vista `/cuenta/facturacion` para que el asesor consulte su estado de pago y el historial procesado por Mercado Pago.

### Etapa 13: Panel Super Admin (`/admin`)
- [x] **Protección de Ruta:** Middleware con verificación de rol `super_admin` (un solo super admin: `SUPER_ADMIN_EMAIL`).
- [x] **Dashboard de Control:**
  - Métricas de ingresos en $ CLP procesados vía Mercado Pago, total de usuarios en Trial vs. Usuarios Pagados.
  - Tabla de asesores con buscador por Email/nombre (el perfil no guarda RUT).
  - Modales de acción: *Extender trial de 7 días, activar suscripción manualmente, cambiar plan o bloquear usuario*.