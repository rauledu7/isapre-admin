"use client";

import { ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { Campo } from "@/components/calculator/Campo";
import { usePermite } from "@/components/layout/AccesoPlan";
import { Button } from "@/components/ui/button";
import { useFechaHoy } from "@/hooks/useFechaHoy";
import { useProspectos } from "@/hooks/useProspectos";
import { estaVencido, grillaMes, seguimientosDelDia } from "@/lib/calendario";
import { crearAgenda, eliminarAgenda, listarAgendas, type Agenda } from "@/lib/supabase/agendas";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarioView() {
  const hoy = useFechaHoy();
  const [cursor, setCursor] = useState<string | null>(null);
  const visible = cursor ?? hoy;
  const anio = Number(visible?.slice(0, 4) ?? "2026");
  const mes = Number(visible?.slice(5, 7) ?? "1");
  const { estado, prospectos } = useProspectos();
  const conSeguimientos = usePermite("pipeline");
  const celdas = grillaMes(anio, mes).flat();
  const desde = celdas[0]?.fecha ?? "";
  const hasta = celdas[celdas.length - 1]?.fecha ?? "";
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [errorAgenda, setErrorAgenda] = useState<string | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const elegido = dia ?? hoy ?? "";

  useEffect(() => {
    if (!desde || !hasta) return;
    let vigente = true;
    void listarAgendas(getSupabase(), desde, hasta)
      .then((lista) => {
        if (!vigente) return;
        setAgendas(lista);
        setErrorAgenda(null);
      })
      .catch((error: Error) => {
        if (!vigente) return;
        setAgendas([]);
        setErrorAgenda(error.message);
      });
    return () => {
      vigente = false;
    };
  }, [desde, hasta]);

  function mover(delta: number) {
    const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1));
    const siguienteMes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    setCursor(`${fecha.getUTCFullYear()}-${siguienteMes}-01`);
  }

  async function recargar() {
    setAgendas(await listarAgendas(getSupabase(), desde, hasta));
  }

  async function agregar(evento: FormEvent) {
    evento.preventDefault();
    if (!elegido || !hora || !nombre.trim()) return;
    setGuardando(true);
    setErrorAgenda(null);
    try {
      await crearAgenda(getSupabase(), { fecha: elegido, hora, nombre, nota });
      setNombre("");
      setNota("");
      setHora("");
      await recargar();
    } catch (error) {
      setErrorAgenda(error instanceof Error ? error.message : "No se pudo guardar la cita.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    setErrorAgenda(null);
    try {
      await eliminarAgenda(getSupabase(), id);
      await recargar();
    } catch (error) {
      setErrorAgenda(error instanceof Error ? error.message : "No se pudo borrar la cita.");
    }
  }

  const titulo = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(anio, mes - 1, 1)),
  );
  const delDia = agendas.filter((agenda) => agenda.fecha === elegido);
  const seguimientos =
    conSeguimientos && estado === "listo" && elegido ? seguimientosDelDia(prospectos, elegido) : [];

  if (!hoy) return <p className="text-sm text-muted-foreground">Cargando calendario…</p>;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(evento) => void agregar(evento)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo label="Día" type="date" value={elegido} onChange={(e) => setDia(e.target.value)} required />
        <Campo label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
        <Campo label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} required />
        <Campo label="Nota" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={500} />
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : "Agregar a la agenda"}
          </Button>
        </div>
      </form>
      {errorAgenda && <p className="text-sm text-destructive">{errorAgenda}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => mover(-1)}>
          <ChevronLeftIcon />
        </Button>
        <h2 className="text-base font-semibold">{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</h2>
        <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => mover(1)}>
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((celda) => {
          const citas = agendas.filter((agenda) => agenda.fecha === celda.fecha);
          const seguimientosDia =
            conSeguimientos && estado === "listo" ? seguimientosDelDia(prospectos, celda.fecha) : [];
          const vencido = estaVencido(celda.fecha, hoy);
          return (
            <div
              key={celda.fecha}
              className={cn(
                "flex min-h-20 flex-col gap-1 rounded-lg p-1.5 text-xs ring-1 ring-foreground/10",
                celda.enMes ? "bg-card" : "bg-muted/40 text-muted-foreground",
                celda.fecha === hoy && "ring-proceso",
                celda.fecha === elegido && "ring-2 ring-foreground",
              )}
            >
              <button
                type="button"
                className={cn("text-left font-medium tabular-nums", vencido && seguimientosDia.length > 0 && "text-alerta")}
                onClick={() => setDia(celda.fecha)}
              >
                {Number(celda.fecha.slice(8))}
              </button>
              {citas.slice(0, 2).map((agenda) => (
                <span key={agenda.id} className="truncate rounded bg-muted px-1 py-0.5 text-foreground">
                  {agenda.hora} {agenda.nombre}
                </span>
              ))}
              {seguimientosDia.slice(0, citas.length >= 2 ? 0 : 2 - citas.length).map((p) => (
                <Link
                  key={p.id}
                  href={`/prospectos/${p.id}`}
                  className="truncate rounded bg-proceso/10 px-1 py-0.5 text-foreground hover:underline"
                >
                  {p.horaContacto ? `${p.horaContacto.slice(0, 5)} ` : ""}
                  {p.nombre}
                </Link>
              ))}
              {citas.length + seguimientosDia.length > 2 && (
                <span className="text-muted-foreground">+{citas.length + seguimientosDia.length - 2}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Día {elegido.split("-").reverse().join("-")}</h3>
        {delDia.length === 0 && seguimientos.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay citas este día.</p>
        )}
        {delDia.map((agenda) => (
          <div key={agenda.id} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">
                <span className="tabular-nums">{agenda.hora}</span> {agenda.nombre}
              </p>
              {agenda.nota && <p className="text-muted-foreground">{agenda.nota}</p>}
            </div>
            <Button variant="ghost" size="icon" aria-label={`Borrar cita de ${agenda.nombre}`} onClick={() => void borrar(agenda.id)}>
              <Trash2Icon />
            </Button>
          </div>
        ))}
        {seguimientos.map((p) => (
          <Link key={p.id} href={`/prospectos/${p.id}`} className="rounded-lg border px-3 py-2 text-sm hover:underline">
            {p.horaContacto ? `${p.horaContacto.slice(0, 5)} ` : ""}
            {p.nombre}
            <span className="ml-2 text-muted-foreground">Prospecto</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
