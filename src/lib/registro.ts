import { planPublico } from "@/config/planesPublicos";
import { PERIODOS, type NivelPlan, type PeriodoPago } from "@/lib/suscripcion";

export type IntencionRegistro = { modo: "trial" } | { modo: "plan"; nivel: NivelPlan; periodo: PeriodoPago };

export function intencionRegistro(plan: string | null, periodo: string | null): IntencionRegistro {
  const elegido = planPublico(plan);
  const periodoValido = PERIODOS.find((item) => item.id === periodo)?.id ?? "mensual";
  if (!elegido) return { modo: "trial" };
  return { modo: "plan", nivel: elegido.nivel, periodo: periodoValido };
}

const MENSAJES: Record<string, string> = {
  signup_disabled: "El registro está apagado en Supabase. Actívalo en Authentication → Sign In / Providers → Email → Allow new users to sign up.",
  user_already_exists: "Ese correo ya tiene cuenta. Entra con tu contraseña.",
  email_exists: "Ese correo ya tiene cuenta. Entra con tu contraseña.",
  weak_password: "La contraseña es muy corta. Usa al menos 8 caracteres.",
  over_request_rate_limit: "Demasiados intentos. Espera un momento y prueba de nuevo.",
};

export function mensajeRegistro(code: string | undefined): string {
  return (code && MENSAJES[code]) || "No se pudo crear la cuenta. Intenta nuevamente.";
}

export function textoAvisoRegistro(entrada: {
  nombre: string | null;
  email: string;
  modo: "trial" | "plan";
  plan: string | null;
}): { titulo: string; cuerpo: string } {
  const quien = entrada.nombre?.trim() || entrada.email.trim();
  const cuerpo =
    entrada.modo === "plan" && entrada.plan
      ? `${quien} creó una cuenta y eligió el plan ${entrada.plan}. La prueba de 7 días ya corre.`
      : `${quien} creó una cuenta en la prueba de 7 días.`;
  return { titulo: "Nuevo registro", cuerpo: cuerpo.slice(0, 300) };
}
