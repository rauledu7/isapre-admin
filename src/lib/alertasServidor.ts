import webpush from "web-push";

import { alertasProgramadas, type AlertaNueva, type ProspectoAlerta } from "@/lib/alertas";
import type { Supabase } from "@/lib/supabase/client";
import { envPublico } from "@/lib/supabase/env";

export interface AvisoPush {
  titulo: string;
  cuerpo: string;
  url: string;
}

function vapidConfigurado(): boolean {
  return Boolean(envPublico().vapid && process.env.VAPID_PRIVATE_KEY?.trim());
}

export async function enviarPush(sb: Supabase, asesorId: string, avisos: AvisoPush[]): Promise<void> {
  const publica = envPublico().vapid;
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publica || !privada || avisos.length === 0) return;

  const asunto = process.env.VAPID_SUBJECT?.trim() || "mailto:isapreassistant@localhost";
  webpush.setVapidDetails(asunto.startsWith("mailto:") || asunto.startsWith("https:") ? asunto : `mailto:${asunto}`, publica, privada);
  const { data } = await sb.from("dispositivos_push").select("id, endpoint, p256dh, auth").eq("asesor_id", asesorId);
  if (!data?.length) return;

  for (const aviso of avisos) {
    const payload = JSON.stringify({ title: aviso.titulo, body: aviso.cuerpo, url: aviso.url });
    for (const dispositivo of data) {
      try {
        await webpush.sendNotification(
          { endpoint: dispositivo.endpoint, keys: { p256dh: dispositivo.p256dh, auth: dispositivo.auth } },
          payload,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await sb.from("dispositivos_push").delete().eq("id", dispositivo.id);
        }
      }
    }
  }
}

export async function revisarAlertasDe(sb: Supabase, asesorId: string, ahora = new Date()): Promise<AlertaNueva[]> {
  const [prospectos, etapas, perfil, dedups] = await Promise.all([
    sb
      .from("prospectos")
      .select("id, nombre, etapa_id, proximo_contacto, hora_contacto, updated_at, cerrado_en, uf_cierre")
      .eq("asesor_id", asesorId),
    sb.from("etapas_embudo").select("id, tipo").eq("asesor_id", asesorId),
    sb.from("perfiles_asesor").select("meta_uf_mes").eq("asesor_id", asesorId).maybeSingle(),
    sb.from("notificaciones").select("dedup").eq("asesor_id", asesorId),
  ]);
  if (prospectos.error) throw new Error(prospectos.error.message);
  if (etapas.error) throw new Error(etapas.error.message);
  if (perfil.error) throw new Error(perfil.error.message);
  if (dedups.error) throw new Error(dedups.error.message);

  const lista: ProspectoAlerta[] = (prospectos.data ?? []).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    etapaId: fila.etapa_id,
    proximoContacto: fila.proximo_contacto,
    horaContacto: fila.hora_contacto ? fila.hora_contacto.slice(0, 5) : null,
    actualizadoEn: fila.updated_at,
    cerradoEn: fila.cerrado_en,
    ufCierre: fila.uf_cierre == null ? null : Number(fila.uf_cierre),
  }));

  const nuevas = alertasProgramadas({
    ahora,
    prospectos: lista,
    etapas: (etapas.data ?? []).map((etapa) => ({
      id: etapa.id,
      tipo: etapa.tipo,
    })),
    metaUfMes: perfil.data?.meta_uf_mes == null ? null : Number(perfil.data.meta_uf_mes),
    dedups: new Set((dedups.data ?? []).map((fila) => fila.dedup)),
  });
  if (nuevas.length === 0) return [];

  const { error } = await sb.from("notificaciones").upsert(
    nuevas.map((alerta) => ({
      asesor_id: asesorId,
      tipo: alerta.tipo,
      titulo: alerta.titulo,
      cuerpo: alerta.cuerpo,
      prospecto_id: alerta.prospectoId,
      dedup: alerta.dedup,
    })),
    { onConflict: "asesor_id,dedup", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);

  await enviarPush(
    sb,
    asesorId,
    nuevas.map((alerta) => ({ titulo: alerta.titulo, cuerpo: alerta.cuerpo, url: alerta.url })),
  );
  return nuevas;
}

export { vapidConfigurado };
