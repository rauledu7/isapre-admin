import type { Isapre, TablaFactores } from "@/types/isapre";

export const ISAPRES: readonly Isapre[] = [
  { id: "banmedica", nombre: "Banmédica" },
  { id: "consalud", nombre: "Consalud" },
  { id: "colmena", nombre: "Colmena" },
  { id: "cruz-blanca", nombre: "Cruz Blanca" },
  { id: "nueva-masvida", nombre: "Nueva Masvida" },
  { id: "esencial", nombre: "Esencial" },
];

export const TASA_COTIZACION_LEGAL = 0.07;

/** Res. Ex. N° 237 SP (feb 2026) y Of. Circ. IF/N° 12 SdS: 7% máximo = 6,3 UF. Reajuste anual. */
export const TOPE_IMPONIBLE_SALUD_UF = 90.0;

/** Tabla Única de Factores (Superintendencia de Salud), vigente para contratos desde abril 2020. */
export const TABLA_FACTORES: TablaFactores | null = {
  id: "tabla-unica",
  nombre: "Tabla de Factores Única",
  tramos: [
    { edadDesde: 0, edadHasta: 20, factores: { titular: 0.6, carga: 0.6 } },
    { edadDesde: 20, edadHasta: 25, factores: { titular: 0.9, carga: 0.7 } },
    { edadDesde: 25, edadHasta: 35, factores: { titular: 1.0, carga: 0.7 } },
    { edadDesde: 35, edadHasta: 45, factores: { titular: 1.3, carga: 0.9 } },
    { edadDesde: 45, edadHasta: 55, factores: { titular: 1.4, carga: 1.0 } },
    { edadDesde: 55, edadHasta: 65, factores: { titular: 2.0, carga: 1.4 } },
    { edadDesde: 65, edadHasta: null, factores: { titular: 2.4, carga: 2.2 } },
  ],
};

export const DECIMALES_UF = 4;
