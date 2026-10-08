---

### `MUST-DO.md`

```markdown
# REGLAS OBLIGATORIAS DEL NEGOCIO Y UX/UI (MUST-DO)

## 1. Tono y Posicionamiento de la App
- **Propósito:** Ser el copiloto operativo y comercial del ejecutivo/asesor de Isapre en Chile.
- **Enfoque de Valor:** Optimizar el tiempo del asesor, reducir errores en el cálculo de planes/excedentes y acelerar el cierre de afiliaciones/cambios de Isapre.

## 2. Reglas del Negocio Isapre (Chile)
1. **El 7% Legal:**
   - La cotización obligatoria de salud es el 7% de la renta imponible (con tope imponible fijado por la ley).
   - `Diferencia = 7% Imponible (en UF) - Valor Total del Plan (en UF)`.
   - Si `Diferencia > 0`: Genera **Excedentes**.
   - Si `Diferencia < 0`: Requiere **Pauta Adicional de Cotización (Cotización Voluntaria/Adicional)**.
2. **Componentes del Valor del Plan:**
   - `Precio Final Plan = (Precio Base del Plan en UF) x (Suma de Factores de Riesgo por Edad/Rol) + Coberturas Adicionales (GES/CAEC/Seguros)`.
3. **Isapres Soportadas:**
   - Banmédica, Consalud, Colmena, Cruz Blanca, Nueva Masvida, Esencial.

## 3. Pilares del Producto (Features Mínimas)
1. **Cotizador & Simulador Express:**
   - Ingreso rápido: Renta imponible (CLP), Edad del titular, Número y edades de cargas familiares, Isapre actual.
   - Cálculo automático de su 7% obligatorio convertido a UF (usando valor UF dinámico o configurable).
2. **CRM / Pipeline de Prospectos para Asesores:**
   - Embudo simple: *Nuevo Contacto -> Evaluación / Evaluando -> Cotización Enviada -> En Firma de FUN -> Afiliado / Cerrado*.
3. **Generador de Comparativas Expres en PDF/Imagen:**
   - Botón para exportar un resumen limpio en PDF o imagen para enviar por WhatsApp al cliente (*"Mira cómo queda tu plan actual vs. la propuesta"*).

## 4. Prohibiciones Explícitas
- ❌ Prohibido mostrar datos sin desglose transparente entre UF y CLP.
- ❌ Prohibido permitir guardar un prospecto sin un teléfono o canal de contacto.
- ❌ Prohibido usar terminología genérica (usar siempre términos reales: *Renta Imponible, Cargas, FUN, Excedentes, Ges, CAEC*).