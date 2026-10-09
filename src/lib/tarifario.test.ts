import { describe, expect, it } from "vitest";

import {
  buscarPlanEnTarifario,
  leerTarifario,
  precioProducto,
  type PalabraTarifa,
  type PlanTarifa,
  type ProductoTarifa,
} from "./tarifario";

function palabras(filas: string[][]): PalabraTarifa[] {
  return filas.flatMap((fila, y) =>
    fila.map((texto, columna) => ({ texto, x: columna === 0 ? 47 : columna === 1 ? 103 : 130, y: y * 20 })),
  );
}

const PRODUCTO: ProductoTarifa = {
  codigo: "1250",
  nombre: "Catastrófico multiprestador max",
  quintoGratis: true,
  tramos: [
    { edadDesde: 0, edadHasta: 18, precioUF: 0.27 },
    { edadDesde: 19, edadHasta: 24, precioUF: 0.35 },
    { edadDesde: 25, edadHasta: 34, precioUF: 0.45 },
    { edadDesde: 35, edadHasta: 44, precioUF: 0.5 },
    { edadDesde: 45, edadHasta: 54, precioUF: 0.91 },
    { edadDesde: 55, edadHasta: 59, precioUF: 1.8 },
  ],
};

describe("leerTarifario", () => {
  it("lee el precio base y la consulta de cada código", () => {
    const leido = leerTarifario([
      palabras([
        ["TARIFARIO SANTIAGO 06 JULIO 2026"],
        ["SALUD CLASICO GOLD"],
        ["CODIGO", "VB"],
        ["BCG260500", "1,2"],
        ["", "", "0,4"],
        ["BCG260502", "1,24", "0,4"],
      ]),
    ]);
    expect(leido.titulo).toBe("SANTIAGO 06 JULIO 2026");
    expect(leido.planes).toEqual([
      { codigo: "BCG260500", linea: "SALUD CLASICO GOLD", precioBaseUF: 1.2, consultaUF: 0.4 },
      { codigo: "BCG260502", linea: "SALUD CLASICO GOLD", precioBaseUF: 1.24, consultaUF: 0.4 },
    ]);
  });

  it("lee el producto con precio por edad y el quinto beneficiario gratis", () => {
    const leido = leerTarifario([
      [
        { texto: "2.-", x: 40, y: 10 },
        { texto: "CATASTRÓFICO", x: 60, y: 10 },
        { texto: "MAX-", x: 150, y: 10 },
        { texto: "Codigo", x: 180, y: 10 },
        { texto: "1250", x: 220, y: 10 },
        { texto: "DESDE", x: 40, y: 30 },
        { texto: "EL", x: 80, y: 30 },
        { texto: "QUINTO", x: 100, y: 30 },
        { texto: "BENEFICIARIO", x: 140, y: 30 },
        { texto: "ES", x: 210, y: 30 },
        { texto: "GRATIS", x: 230, y: 30 },
        { texto: "PRECIOS", x: 40, y: 50 },
        { texto: "CATASTROFICO", x: 90, y: 50 },
        { texto: "1250", x: 180, y: 50 },
        { texto: "30", x: 40, y: 70 },
        { texto: "dias", x: 55, y: 70 },
        { texto: "-", x: 80, y: 70 },
        { texto: "18", x: 90, y: 70 },
        { texto: "años", x: 110, y: 70 },
        { texto: "0,27", x: 250, y: 70 },
        { texto: "UF", x: 280, y: 70 },
        { texto: "55", x: 40, y: 90 },
        { texto: "-", x: 55, y: 90 },
        { texto: "59", x: 65, y: 90 },
        { texto: "años", x: 85, y: 90 },
        { texto: "1,8", x: 250, y: 90 },
        { texto: "UF", x: 280, y: 90 },
      ],
    ]);
    expect(leido.productos).toEqual([
      {
        codigo: "1250",
        nombre: "CATASTRÓFICO MAX",
        quintoGratis: true,
        fijo: false,
        modalidad: "por_beneficiario",
        tramos: [
          { edadDesde: 0, edadHasta: 18, precioUF: 0.27 },
          { edadDesde: 55, edadHasta: 59, precioUF: 1.8 },
        ],
      },
    ]);
  });
});

const PLANES: PlanTarifa[] = [
  { codigo: "BSCC260122", linea: "SALUD CONECTA CLASICO (PLAN CERRADO)", precioBaseUF: 1.05, consultaUF: null },
  { codigo: "SC100", linea: "SALUD CLASICO", precioBaseUF: 0.9, consultaUF: null },
  { codigo: "BCG260500", linea: "SALUD CLASICO GOLD", precioBaseUF: 1.2, consultaUF: 0.4 },
  { codigo: "BCG260502", linea: "SALUD CLASICO GOLD", precioBaseUF: 1.24, consultaUF: 0.4 },
];

describe("buscarPlanEnTarifario", () => {
  it("elige por el código del PDF", () => {
    const plan = buscarPlanEnTarifario(PLANES, {
      codigo: "bscc260122",
      nombre: "Salud Conecta Clásico 22/2601",
    });
    expect(plan?.codigo).toBe("BSCC260122");
    expect(plan?.precioBaseUF).toBe(1.05);
  });

  it("elige la línea más específica cuando el PDF no trae código", () => {
    expect(buscarPlanEnTarifario(PLANES, { codigo: null, nombre: "Salud Conecta Clásico 22/2601" })?.codigo).toBe(
      "BSCC260122",
    );
  });

  it("no elige si dos planes comparten la misma línea", () => {
    expect(buscarPlanEnTarifario(PLANES, { codigo: null, nombre: "Salud Clásico Gold" })).toBeNull();
    expect(buscarPlanEnTarifario(PLANES, { codigo: "BCG260502", nombre: "Salud Clásico Gold" })?.precioBaseUF).toBe(
      1.24,
    );
  });
});

describe("columnas movidas y productos adicionales", () => {
  it("lee el precio base junto al encabezado VB aunque la columna no esté en el mismo lugar", () => {
    const leido = leerTarifario([
      [
        { texto: "CODIGO", x: 86, y: 129 },
        { texto: "VB", x: 128, y: 129 },
        { texto: "CONS UF", x: 145, y: 130 },
        { texto: "BCG260500", x: 81, y: 145 },
        { texto: "1,2", x: 128, y: 145 },
        { texto: "BCG260522", x: 81, y: 178 },
        { texto: "1,28", x: 126, y: 178 },
        { texto: "0,4", x: 151, y: 178 },
      ],
    ]);
    expect(leido.planes).toEqual([
      { codigo: "BCG260500", linea: null, precioBaseUF: 1.2, consultaUF: null },
      { codigo: "BCG260522", linea: null, precioBaseUF: 1.28, consultaUF: 0.4 },
    ]);
  });

  it("toma los productos bajo el título Productos adicionales, no solo los catastróficos", () => {
    const leido = leerTarifario([
      [
        { texto: "1339", x: 37, y: 20 },
        { texto: "0,18", x: 111, y: 20 },
        { texto: "PRODUCTOS ADICIONALES", x: 194, y: 40 },
        { texto: "COBERTURA SIN TOPE ANUAL EN KINESIOLOGÍA", x: 56, y: 70 },
        { texto: "1339", x: 37, y: 100 },
        { texto: "0,18", x: 111, y: 100 },
        { texto: "Todos los planes x Benef", x: 181, y: 100 },
        { texto: "PACK DE ASISTENCIAS", x: 400, y: 70 },
        { texto: "1462", x: 340, y: 100 },
        { texto: "0,25", x: 470, y: 100 },
        { texto: "Por grupo familiar", x: 500, y: 100 },
      ],
    ]);
    expect(leido.productos.map((producto) => producto.codigo)).toEqual(["1339", "1462"]);
    expect(leido.productos[0]).toMatchObject({
      nombre: "COBERTURA SIN TOPE ANUAL EN KINESIOLOGÍA",
      fijo: true,
      modalidad: "por_beneficiario",
      tramos: [{ edadDesde: 0, edadHasta: 120, precioUF: 0.18 }],
    });
    expect(leido.productos[1]?.modalidad).toBe("por_contrato");
  });
});

describe("precioProducto", () => {
  it("cobra los cuatro más caros y deja gratis al resto", () => {
    const r = precioProducto(PRODUCTO, [40, 10, 30, 50, 58, 20]);
    expect(r.sinPrecio).toEqual([]);
    expect(r.totalUF).toBeCloseTo(3.66, 10);
  });

  it("avisa la edad que el producto no tarifica", () => {
    expect(precioProducto(PRODUCTO, [70]).sinPrecio).toEqual([70]);
  });

  it("cobra una vez el producto por contrato y por cada edad el que es por beneficiario", () => {
    const fijo = {
      codigo: "1462",
      nombre: "Pack",
      tramos: [{ edadDesde: 0, edadHasta: 120, precioUF: 0.25 }],
      quintoGratis: false,
      fijo: true,
    };
    expect(precioProducto({ ...fijo, modalidad: "por_contrato" }, [40, 10]).totalUF).toBe(0.25);
    expect(precioProducto({ ...fijo, modalidad: "por_beneficiario" }, [40, 10]).totalUF).toBe(0.5);
  });
});
