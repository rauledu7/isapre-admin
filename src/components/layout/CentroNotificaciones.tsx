"use client";

import { BellIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Aviso {
  id: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  prospecto_id: string | null;
}

function claveAplicacion(base64: string): Uint8Array<ArrayBuffer> {
  const limpia = base64.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = "=".repeat((4 - (limpia.length % 4)) % 4);
  const crudo = atob(limpia + relleno);
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

export function CentroNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activando, setActivando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error: fallo } = await getSupabase()
      .from("notificaciones")
      .select("id, titulo, cuerpo, leida, prospecto_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (fallo) {
      setError(fallo.message);
      return;
    }
    setError(null);
    setAvisos(data ?? []);
  }, []);

  useEffect(() => {
    let vivo = true;
    async function tick() {
      await fetch("/api/alertas/revisar", { method: "POST" }).catch(() => undefined);
      if (vivo) await cargar();
    }
    void tick();
    const id = setInterval(() => void tick(), 60_000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [cargar]);

  const noLeidas = avisos.filter((aviso) => !aviso.leida).length;

  async function abrir() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente && noLeidas > 0) {
      await getSupabase().from("notificaciones").update({ leida: true }).eq("leida", false);
      setAvisos((lista) => lista.map((aviso) => ({ ...aviso, leida: true })));
    }
  }

  async function activarPush() {
    const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!clave) {
      setError("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY para enviar alertas con el navegador cerrado.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Este navegador no acepta notificaciones push.");
      return;
    }
    setActivando(true);
    setError(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setError("Permiso de notificaciones denegado.");
        return;
      }
      const registro = await navigator.serviceWorker.register("/sw.js");
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveAplicacion(clave),
      });
      const json = suscripcion.toJSON();
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!p256dh || !auth) throw new Error("La suscripción no trae claves");
      const { error: guardado } = await getSupabase().from("dispositivos_push").insert({
        endpoint: suscripcion.endpoint,
        p256dh,
        auth,
      });
      if (guardado && guardado.code !== "23505") throw new Error(guardado.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo activar");
    } finally {
      setActivando(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Notificaciones" aria-expanded={abierto} onClick={() => void abrir()}>
        <BellIcon />
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-alerta text-[10px] text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </Button>
      {abierto && (
        <div className="absolute right-0 z-40 mt-2 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-xl bg-popover p-3 text-sm text-popover-foreground ring-1 ring-foreground/10">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">Alertas</p>
            <Button variant="outline" size="sm" disabled={activando} onClick={() => void activarPush()}>
              {activando ? "Activando…" : "Activar push"}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {avisos.length === 0 && <li className={cn("text-muted-foreground")}>Sin alertas.</li>}
            {avisos.map((aviso) => (
              <li key={aviso.id} className={cn("rounded-lg px-2 py-1.5", !aviso.leida && "bg-proceso/10")}>
                <p className="font-medium">{aviso.titulo}</p>
                <p className="text-muted-foreground">{aviso.cuerpo}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
