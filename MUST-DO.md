# REGLAS OBLIGATORIAS DEL NEGOCIO Y UX/UI (MUST-DO)

## Pasarela de Pagos Exclusiva: Mercado Pago Chile
- **Proveedor:** Mercado Pago SDK Node.js (`mercadopago`).
- **Compatibilidad de Cuenta:** Cuenta personal o profesional (no requiere razón social ni RUT empresa).
- **Flujo de Cobro Recurrente / Checkout:**
  - Uso de **Preauthorizations / Subscriptions API** de Mercado Pago o **Checkout Pro / Preferences** con facturación periódica.
  - Métodos aceptados en Chile: Tarjetas de Crédito, Débito (Webpay/Redcompra) y Dinero en Mercado Pago.
- **Webhooks:** Handler seguro en `/api/v1/webhooks/mercadopago` para procesar notificaciones `subscription_preapproval` y `payment`.