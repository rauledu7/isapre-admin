import { alertaCambioEtapa } from "@/lib/alertas";
import { getSupabase } from "@/lib/supabase/client";
import type { EtapaEmbudo } from "@/types/isapre";

/** Avisa el cambio de etapa sin impedir guardar el prospecto si la tabla aún no existe. */
export function avisarCambioEtapa(
  prospecto: { id: string; nombre: string },
  etapaId: string,
  etapas: EtapaEmbudo[],
): void {
  const etapa = etapas.find((item) => item.id === etapaId);
  const alerta = alertaCambioEtapa(prospecto.id, prospecto.nombre, etapaId, etapa?.nombre ?? "otra etapa", Date.now());
  void (async () => {
    const { data } = await getSupabase()
      .from("notificaciones")
      .insert({
        tipo: alerta.tipo,
        titulo: alerta.titulo,
        cuerpo: alerta.cuerpo,
        prospecto_id: alerta.prospectoId,
        dedup: alerta.dedup,
      })
      .select("id")
      .single();
    if (!data) return;
    await fetch("/api/push/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [data.id] }),
    });
  })().catch(() => undefined);
}
