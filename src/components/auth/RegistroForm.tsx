"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANES_PUBLICOS, planPublico, precioPublico } from "@/config/planesPublicos";
import { formatCLP } from "@/lib/format";
import { intencionRegistro, mensajeRegistro } from "@/lib/registro";
import { getSupabase } from "@/lib/supabase/client";
import { listarPlanes } from "@/lib/supabase/suscripciones";
import { PERIODOS, type PeriodoPago } from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

async function abrirPago(nivel: string, periodo: PeriodoPago): Promise<string | null> {
  const plan = (await listarPlanes(getSupabase())).find((item) => item.nivel === nivel);
  if (!plan) return "Ese plan no está publicado.";
  const respuesta = await fetch("/api/v1/checkout/mercadopago", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: plan.id, periodo }),
  });
  const cuerpo = (await respuesta.json()) as { url?: string; error?: string };
  if (respuesta.status === 503) return null;
  if (!respuesta.ok || !cuerpo.url) return cuerpo.error ?? "No se pudo abrir el pago.";
  window.location.assign(cuerpo.url);
  return "redirigiendo";
}

export function RegistroForm() {
  const router = useRouter();
  const params = useSearchParams();
  const llegada = intencionRegistro(params.get("plan"), params.get("periodo"));
  const [modo, setModo] = useState(llegada.modo);
  const [nivel, setNivel] = useState(llegada.modo === "plan" ? llegada.nivel : "intermedio");
  const [periodo, setPeriodo] = useState<PeriodoPago>(llegada.modo === "plan" ? llegada.periodo : "mensual");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [conSesion, setConSesion] = useState(false);

  async function cerrarIntento(nivelPago: string, periodoPago: PeriodoPago, modoPago: "trial" | "plan") {
    if (modoPago === "trial") {
      router.replace("/");
      router.refresh();
      return;
    }
    let resultado: string | null;
    try {
      resultado = await abrirPago(nivelPago, periodoPago);
    } catch {
      setError("La cuenta quedó creada. No pude abrir el pago: entra y contrata desde Suscripción.");
      setEnviando(false);
      return;
    }
    if (resultado === "redirigiendo") return;
    if (resultado === null) {
      setAviso("Tu cuenta quedó creada y la prueba de 7 días ya corre. El pago en línea todavía no está conectado: cuando lo esté, contratas desde Suscripción y el primer cobro parte al terminar la prueba.");
    } else {
      setError(resultado);
    }
    setEnviando(false);
  }

  useEffect(() => {
    let vigente = true;
    void getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!vigente || !data.session) return;
        setConSesion(true);
        if (llegada.modo === "trial") {
          router.replace("/");
          router.refresh();
          return;
        }
        setAviso("Tu correo ya quedó confirmado. Revisa el plan y sigue al pago. El primer cobro es al terminar la prueba.");
      });
    return () => {
      vigente = false;
    };
    // Solo al volver del correo de confirmación, con la intención de la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    const { data: sesion } = await getSupabase().auth.getSession();
    if (sesion.session) {
      setEnviando(true);
      await cerrarIntento(nivel, periodo, modo);
      return;
    }
    if (nombre.trim().length < 2) {
      setError("Escribe tu nombre.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    setEnviando(true);
    const destino = new URL("/registro", window.location.origin);
    if (modo === "plan") {
      destino.searchParams.set("plan", planPublico(nivel)?.slug ?? nivel);
      destino.searchParams.set("periodo", periodo);
    }
    const { data, error: fallo } = await getSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nombre: nombre.trim() }, emailRedirectTo: destino.toString() },
    });
    if (fallo) {
      setError(mensajeRegistro(fallo.code));
      setEnviando(false);
      return;
    }
    if (!data.session) {
      setAviso(
        modo === "plan"
          ? "Te enviamos un correo para confirmar la cuenta. Al abrirlo vuelves aquí y sigues al pago. La prueba de 7 días ya quedó contando."
          : "Te enviamos un correo para confirmar la cuenta. Al abrirlo entras a la prueba de 7 días.",
      );
      setEnviando(false);
      return;
    }
    await cerrarIntento(nivel, periodo, modo);
  }

  const elegido = planPublico(nivel);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Siete días con el escritorio completo. Si eliges un plan, el primer cobro es al terminar la prueba.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={modo === "trial"}
          onClick={() => setModo("trial")}
          className={cn("rounded-xl border px-3 py-3 text-left", modo === "trial" ? "border-primary bg-primary/5" : "hover:bg-muted/60")}
        >
          <span className="block text-sm font-medium">Prueba de 7 días</span>
          <span className="mt-1 block text-xs text-muted-foreground">Entras ahora. Eliges plan después.</span>
        </button>
        <button
          type="button"
          aria-pressed={modo === "plan"}
          onClick={() => setModo("plan")}
          className={cn("rounded-xl border px-3 py-3 text-left", modo === "plan" ? "border-primary bg-primary/5" : "hover:bg-muted/60")}
        >
          <span className="block text-sm font-medium">Contratar un plan</span>
          <span className="mt-1 block text-xs text-muted-foreground">Dejas el medio de pago listo. Se cobra al día 7.</span>
        </button>
      </div>

      {modo === "plan" && elegido && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Plan</legend>
          <div className="grid gap-2">
            {PLANES_PUBLICOS.map((plan) => (
              <label key={plan.nivel} className={cn("flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2", nivel === plan.nivel && "border-primary")}>
                <span className="flex items-center gap-2 text-sm">
                  <input type="radio" name="plan" checked={nivel === plan.nivel} onChange={() => setNivel(plan.nivel)} />
                  {plan.nombre}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">{formatCLP(precioPublico(plan, periodo))}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODOS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={periodo === item.id}
                onClick={() => setPeriodo(item.id)}
                className={cn("rounded-full border px-3 py-1 text-xs", periodo === item.id ? "border-primary bg-primary/5" : "")}
              >
                {item.nombre}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {!conSesion && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" autoComplete="name" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {aviso && <p role="status" className="text-sm text-muted-foreground">{aviso}</p>}

      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando cuenta…" : conSesion && modo === "plan" ? "Continuar al pago" : modo === "plan" ? "Crear cuenta y continuar al pago" : "Empezar los 7 días"}
      </Button>
      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
