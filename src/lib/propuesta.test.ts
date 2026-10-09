import { describe, expect, it } from "vitest";

import { TABLA_FACTORES } from "@/config/isapres";
import { evaluarCotizacion } from "@/lib/calculators/cotizador";

import { mensajeWhatsApp, NOTA_LEGAL, urlWhatsApp, type Propuesta } from "./propuesta";

const VALOR_UF = 41122.74;

function propuesta(extra: Partial<Propuesta> = {}, precioPlanActualUF: number | null = 3.5): Propuesta {
  const resultado = evaluarCotizacion({
    rentaImponibleCLP: 1_800_000,
    edadTitular: 40,
    edadesCargas: [],
    precioPlanActualUF,
    planes: [
      {
        id: "p1",
        isapreId: "colmena",
        nombre: "Plan Óptimo",
        precioBaseUF: 1.85,
        gesUF: 0.6,
        seguroUF: 0,
      },
    ],
    valorUF: VALOR_UF,
    topeImponibleUF: 90,
    tabla: TABLA_FACTORES!,
  });
  return {
    clienteNombre: "Juan Pérez",
    isapreActual: "banmedica",
    asesor: {
      nombre: "Raúl Febres",
      telefono: "+56912345678",
      email: "raul@ejemplo.cl",
      metaUfMes: null,
      metaContratosMes: null,
      sitioWeb: null,
    },
    valorUF: { valor: VALOR_UF, fecha: "2026-10-08", fuente: "mindicador" },
    topeImponibleUF: 90,
    resultado,
    ...extra,
  };
}

describe("mensajeWhatsApp", () => {
  const texto = mensajeWhatsApp(propuesta());

  it("saluda por el primer nombre", () => {
    expect(texto.startsWith("Hola Juan,")).toBe(true);
  });

  it("incluye renta imponible y 7% legal en UF y CLP", () => {
    expect(texto).toContain("Renta imponible: $1.800.000 (43,7714 UF)");
    expect(texto).toContain("7% obligatorio: *3,0640 UF* ($126.000)");
  });

  it("incluye plan actual, desglose, diferencia y ahorro", () => {
    expect(texto).toContain("*Plan actual (Banmédica)*");
    expect(texto).toContain("*Propuesta 1: Plan Óptimo (Colmena)*");
    expect(texto).toContain("Precio base × suma de factores (1,8500 UF × 1,3): 2,4050 UF");
    expect(texto).toContain("GES (0,6000 UF × 1 beneficiario): 0,6000 UF");
    expect(texto).toContain("Precio final: *3,0050 UF*");
    expect(texto).toContain("Excedentes mensuales: 0,0590 UF");
    expect(texto).toContain("Ahorro vs. plan actual: 0,4950 UF");
  });

  it("incluye UF usada, nota legal y firma del asesor", () => {
    expect(texto).toContain("UF $41.122,74 del 08-10-2026");
    expect(texto).toContain(`_${NOTA_LEGAL}_`);
    expect(texto.endsWith("Raúl Febres\n+56 9 1234 5678 · raul@ejemplo.cl")).toBe(true);
  });

  it("omite plan actual, ahorro y firma cuando no existen", () => {
    const sinExtras = mensajeWhatsApp(propuesta({ asesor: null, clienteNombre: null }, null));
    expect(sinExtras.startsWith("Hola, te comparto")).toBe(true);
    expect(sinExtras).not.toContain("Plan actual");
    expect(sinExtras).not.toContain("plan actual");
    expect(sinExtras.endsWith(`_${NOTA_LEGAL}_`)).toBe(true);
  });
});

describe("urlWhatsApp", () => {
  it("usa el teléfono sin '+' y codifica el texto", () => {
    expect(urlWhatsApp("Hola *Juan*\n7%", "+56912345678")).toBe(
      "https://wa.me/56912345678?text=Hola%20*Juan*%0A7%25",
    );
  });

  it("sin teléfono deja elegir el contacto", () => {
    expect(urlWhatsApp("x")).toBe("https://wa.me/?text=x");
  });
});
