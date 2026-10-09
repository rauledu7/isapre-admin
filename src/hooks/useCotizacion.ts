"use client";

import { useMemo } from "react";

import { TABLA_FACTORES, TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { useGesIsapres } from "@/hooks/useGesIsapres";
import { evaluarCotizacion, type ResultadoEvaluacion } from "@/lib/calculators/cotizador";
import { leerFormulario, type DatosCotizacion } from "@/lib/cotizadorForm";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useValorUF } from "@/store/ufStore";
import type { ValorUF } from "@/types/isapre";

export type EstadoCotizacion =
  | { estado: "sin_uf" }
  | { estado: "incompleto"; faltantes: string[] }
  | { estado: "error"; mensaje: string }
  | {
      estado: "listo";
      valorUF: ValorUF;
      datos: DatosCotizacion;
      resultado: ResultadoEvaluacion;
      planesIncompletos: string[];
    };

export function useCotizacion(): EstadoCotizacion {
  const cliente = useCotizadorStore((s) => s.cliente);
  const cargas = useCotizadorStore((s) => s.cargas);
  const planes = useCotizadorStore((s) => s.planes);
  const valorUF = useValorUF();
  const ges = useGesIsapres();

  return useMemo(() => {
    if (!valorUF) return { estado: "sin_uf" };
    if (!TABLA_FACTORES) {
      return { estado: "error", mensaje: "No hay Tabla de Factores configurada" };
    }

    const lectura = leerFormulario(cliente, cargas, planes, ges);
    if (!lectura.ok) return { estado: "incompleto", faltantes: lectura.faltantes };

    try {
      const resultado = evaluarCotizacion({
        ...lectura.datos,
        valorUF: valorUF.valor,
        topeImponibleUF: TOPE_IMPONIBLE_SALUD_UF,
        tabla: TABLA_FACTORES,
      });
      return {
        estado: "listo",
        valorUF,
        datos: lectura.datos,
        resultado,
        planesIncompletos: lectura.planesIncompletos,
      };
    } catch (e) {
      return { estado: "error", mensaje: e instanceof Error ? e.message : "Error de cálculo" };
    }
  }, [cliente, cargas, planes, valorUF, ges]);
}
