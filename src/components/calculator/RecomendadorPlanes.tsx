"use client";

import { CheckIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GES_UF, ISAPRES, TABLA_FACTORES, TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { useGesIsapres } from "@/hooks/useGesIsapres";
import {
  recomendarParaProspecto,
  type CandidatoRecomendacion,
  type PlanRecomendado,
} from "@/lib/calculators/recomendarPlanes";
import { leerFormulario } from "@/lib/cotizadorForm";
import { formatUF } from "@/lib/format";
import type { TarifarioGuardado } from "@/lib/supabase/tarifarios";
import { useCotizadorStore, useHidratarCotizador } from "@/store/cotizadorStore";
import { useValorUF } from "@/store/ufStore";
import type { PlanForm } from "@/types/cotizador";
import type { IsapreId } from "@/types/isapre";

function textoUF(valor: number): string {
  return valor.toLocaleString("es-CL", { maximumFractionDigits: 4, useGrouping: false });
}

function frase(texto: string): string {
  const limpio = texto.toLocaleLowerCase("es-CL");
  return limpio.charAt(0).toLocaleUpperCase("es-CL") + limpio.slice(1);
}

function nombreIsapre(id: IsapreId): string {
  return ISAPRES.find((isapre) => isapre.id === id)?.nombre ?? "Isapre";
}

function aFormulario(plan: PlanRecomendado, gesManual: boolean): Omit<PlanForm, "id"> {
  const linea = plan.linea?.trim();
  return {
    isapreId: plan.isapreId,
    nombre: linea ? `${frase(linea)} (${plan.codigo})` : plan.codigo,
    precioBaseUF: textoUF(plan.precioBaseUF),
    seguroUF: "",
    codigoTarifa: plan.codigo,
    productosTarifa: [],
    incluyeConsulta: false,
    gesManual,
    gesUF: gesManual ? textoUF(plan.gesUF) : undefined,
  };
}

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });
}

interface Vista {
  fase: "buscando" | "listo" | "vacio" | "incompleto";
  planes: PlanRecomendado[];
  cotizacionLegalUF: number | null;
  faltantes: string[];
}

function Busqueda() {
  return (
    <div className="recomendar-aparecer flex flex-col items-center gap-4 py-3 text-center">
      <div className="relative grid size-16 place-items-center" aria-hidden>
        <span className="recomendar-onda absolute inset-0 rounded-full bg-primary/20" />
        <span className="recomendar-onda recomendar-onda-tarde absolute inset-0 rounded-full bg-primary/15" />
        <span className="relative grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <SearchIcon className="size-5" />
        </span>
      </div>
      <DialogHeader className="items-center">
        <DialogTitle>Buscando planes</DialogTitle>
        <DialogDescription>Los que más se ajustan al 7% de este prospecto.</DialogDescription>
      </DialogHeader>
    </div>
  );
}

function Encontrados({ planes, cotizacionLegalUF }: { planes: PlanRecomendado[]; cotizacionLegalUF: number }) {
  return (
    <div className="recomendar-aparecer flex flex-col items-center gap-4 py-3 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
        <CheckIcon className="size-5" />
      </span>
      <DialogHeader className="items-center">
        <DialogTitle>Planes recomendados</DialogTitle>
        <DialogDescription>
          Dejé {planes.length === 1 ? "el más cercano" : `los ${planes.length} más cercanos`} a su 7% de{" "}
          {formatUF(cotizacionLegalUF)}. Puedes cambiarlos.
        </DialogDescription>
      </DialogHeader>
      <ul className="flex w-full flex-col gap-2 text-left">
        {planes.map((plan) => (
          <li key={`${plan.isapreId}-${plan.codigo}`} className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-sm font-medium">
              {nombreIsapre(plan.isapreId)} · {plan.linea ? frase(plan.linea) : plan.codigo}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">{formatUF(plan.precioFinalUF)} al mes</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SinDatos({ faltantes }: { faltantes: string[] }) {
  return (
    <div className="recomendar-aparecer flex flex-col items-center gap-4 py-3 text-center">
      <DialogHeader className="items-center">
        <DialogTitle>Faltan datos del prospecto</DialogTitle>
        <DialogDescription>
          {faltantes.length > 0
            ? `Falta ${faltantes.join(", ")}.`
            : "Completa la renta y las edades, y vuelve a buscar."}
        </DialogDescription>
      </DialogHeader>
    </div>
  );
}
function SinTarifario() {
  return (
    <div className="recomendar-aparecer flex flex-col items-center gap-4 py-3 text-center">
      <DialogHeader className="items-center">
        <DialogTitle>Sin planes para recomendar</DialogTitle>
        <DialogDescription>
          Carga un tarifario en Isapres y vuelve a buscar con la lupa.
        </DialogDescription>
      </DialogHeader>
    </div>
  );
}

export function RecomendadorPlanes({
  tarifarios,
  tarifariosListos,
  max,
  gesManual,
}: {
  tarifarios: TarifarioGuardado[];
  tarifariosListos: boolean;
  max: number;
  gesManual: boolean;
}) {
  const hidratado = useHidratarCotizador();
  const cliente = useCotizadorStore((s) => s.cliente);
  const cargas = useCotizadorStore((s) => s.cargas);
  const fijarPlanes = useCotizadorStore((s) => s.fijarPlanes);
  const pedido = useCotizadorStore((s) => s.pedidoRecomendacion);
  const valorUF = useValorUF();
  const { valores: ges, listo: gesListo } = useGesIsapres();
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<Vista>({
    fase: "buscando",
    planes: [],
    cotizacionLegalUF: null,
    faltantes: [],
  });
  const cerrado = useRef(false);
  const enCurso = useRef<string | null>(null);

  const firma = useMemo(() => {
    if (!hidratado || !gesListo || !tarifariosListos || !valorUF || !TABLA_FACTORES || max < 1) return null;
    const lectura = leerFormulario(cliente, cargas, [], ges);
    if (!lectura.ok) return null;
    const gesFirma = ISAPRES.map((isapre) => `${isapre.id}:${ges[isapre.id] ?? GES_UF[isapre.id]}`).join(",");
    const tarifasFirma = tarifarios
      .map((tarifario) =>
        `${tarifario.isapreId}:${tarifario.planes.map((plan) => `${plan.codigo}@${plan.precioBaseUF}`).join(",")}`,
      )
      .join("|");
    const { rentaImponibleCLP, edadTitular, edadesCargas } = lectura.datos;
    return `${rentaImponibleCLP};${edadTitular};${edadesCargas.join(",")};${valorUF.valor};${max};${gesFirma};${tarifasFirma}`;
  }, [hidratado, gesListo, tarifariosListos, valorUF, max, cliente, cargas, ges, tarifarios]);

  const firmaRef = useRef<string | null>(null);
  firmaRef.current = firma;
  const contexto = useRef({ cliente, cargas, ges, tarifarios, valorUF, max, gesManual });
  contexto.current = { cliente, cargas, ges, tarifarios, valorUF, max, gesManual };

  useEffect(() => {
    if (!pedido) return;
    if (!hidratado || !gesListo || !tarifariosListos || !valorUF || !TABLA_FACTORES) return;

    const actual = contexto.current;
    const lectura = leerFormulario(actual.cliente, actual.cargas, [], actual.ges);
    if (!lectura.ok) {
      setVista({ fase: "incompleto", planes: [], cotizacionLegalUF: null, faltantes: lectura.faltantes });
      setAbierto(true);
      const timer = window.setTimeout(() => setAbierto(false), 2400);
      return () => window.clearTimeout(timer);
    }

    const firmaActual = firmaRef.current;
    if (!firmaActual) return;
    const tabla = TABLA_FACTORES;

    const candidatos: CandidatoRecomendacion[] = actual.tarifarios.flatMap((tarifario) =>
      tarifario.planes.map((plan) => ({
        isapreId: tarifario.isapreId,
        codigo: plan.codigo,
        linea: plan.linea,
        precioBaseUF: plan.precioBaseUF,
        gesUF: actual.ges[tarifario.isapreId] ?? GES_UF[tarifario.isapreId],
      })),
    );
    const controlador = new AbortController();
    enCurso.current = firmaActual;
    cerrado.current = false;
    setVista({ fase: "buscando", planes: [], cotizacionLegalUF: null, faltantes: [] });
    setAbierto(true);
    const recomendacion = recomendarParaProspecto({
      rentaImponibleCLP: lectura.datos.rentaImponibleCLP,
      edadTitular: lectura.datos.edadTitular,
      edadesCargas: lectura.datos.edadesCargas,
      valorUF: valorUF.valor,
      topeImponibleUF: TOPE_IMPONIBLE_SALUD_UF,
      tabla,
      cantidad: actual.max,
      candidatos,
    });
    void esperar(1200, controlador.signal).then(() => {
      if (controlador.signal.aborted) return;
      if (recomendacion.planes.length > 0) {
        fijarPlanes(recomendacion.planes.map((plan) => aFormulario(plan, actual.gesManual)));
      }
      enCurso.current = null;
      setVista({
        fase: recomendacion.planes.length > 0 ? "listo" : "vacio",
        planes: recomendacion.planes,
        cotizacionLegalUF: recomendacion.cotizacionLegalUF,
        faltantes: [],
      });
      if (!cerrado.current) setAbierto(true);
      if (recomendacion.planes.length > 0) return;
      return esperar(2400, controlador.signal).then(() => {
        if (!controlador.signal.aborted) setAbierto(false);
      });
    });

    return () => {
      controlador.abort();
      if (enCurso.current === firmaActual) enCurso.current = null;
    };
  }, [pedido, hidratado, gesListo, tarifariosListos, valorUF, fijarPlanes]);

  return (
    <Dialog
      open={abierto}
      onOpenChange={(abiertoSiguiente) => {
        setAbierto(abiertoSiguiente);
        if (!abiertoSiguiente) cerrado.current = true;
      }}
    >
      <DialogContent className="sm:max-w-md" aria-busy={vista.fase === "buscando"}>
        {vista.fase === "buscando" && <Busqueda />}
        {vista.fase === "listo" && vista.cotizacionLegalUF !== null && (
          <Encontrados planes={vista.planes} cotizacionLegalUF={vista.cotizacionLegalUF} />
        )}
        {vista.fase === "vacio" && <SinTarifario />}
        {vista.fase === "incompleto" && <SinDatos faltantes={vista.faltantes} />}
      </DialogContent>
    </Dialog>
  );
}
