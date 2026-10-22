import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { extractTextItems, getDocumentProxy } from "unpdf";

vi.mock("server-only", () => ({}));

import { leerArchivoTarifario } from "./tarifarioArchivo";
import type { PalabraTarifa } from "./tarifario";
import { leerTarifarioVidaTres } from "./tarifarioVidaTres";

const PDF = new URL("./fixtures/vida-tres-santiago-octubre-2026.pdf", import.meta.url);

describe("leerTarifarioVidaTres", () => {
  it("lee el precio base de la columna Base y no la cobertura en UF", () => {
    const leido = leerTarifarioVidaTres([
      [
        { texto: "TARIFARIO VIDA TRES SANTIAGO OCTUBRE 2026", x: 40, y: 20 },
        { texto: "Plan Familiar o individual", x: 60, y: 80 },
        { texto: "Codigo", x: 140, y: 80 },
        { texto: "Base", x: 190, y: 80 },
        { texto: "Vanguardia Platinum B", x: 60, y: 110 },
        { texto: "VPLPB250611", x: 130, y: 114 },
        { texto: "1,83", x: 188, y: 114 },
        { texto: "11/2506", x: 70, y: 122 },
        { texto: "0,45 UF LE/ Cons y Ex 80%", x: 230, y: 114 },
      ],
    ]);

    expect(leido.titulo).toBe("VIDA TRES SANTIAGO OCTUBRE 2026");
    expect(leido.planes).toEqual([
      {
        codigo: "VPLPB250611",
        linea: "Vanguardia Platinum B 11/2506",
        precioBaseUF: 1.83,
        consultaUF: null,
      },
    ]);
  });

  it("no toma el formato de Banmédica ni la tabla de factores", () => {
    const leido = leerTarifarioVidaTres([
      [
        { texto: "CODIGO", x: 40, y: 20 },
        { texto: "VB", x: 100, y: 20 },
        { texto: "BCG260500", x: 40, y: 40 },
        { texto: "1,2", x: 100, y: 40 },
        { texto: "0 a Menos de 20 Años", x: 40, y: 80 },
        { texto: "0,60", x: 200, y: 80 },
        { texto: "GES VIDA TRES", x: 40, y: 100 },
        { texto: "0,712", x: 200, y: 100 },
      ],
    ]);
    expect(leido.planes).toEqual([]);
    expect(leido.productos).toEqual([]);
  });

  it("lee el catálogo: venta afiliado es por contrato y beneficiario se multiplica", () => {
    const leido = leerTarifarioVidaTres([
      [
        { texto: "Código", x: 160, y: 28 },
        { texto: "PRODUCTO", x: 330, y: 28 },
        { texto: "PRECIO", x: 560, y: 28 },
        { texto: "UF", x: 657, y: 28 },
        { texto: "1336", x: 166, y: 44 },
        { texto: "AUMENTO COBERTURA INTERNACIONAL 100 UF", x: 264, y: 44 },
        { texto: "0,02 UF Venta Beneficiario", x: 528, y: 44 },
        { texto: "0,02", x: 669, y: 44 },
        { texto: "1277", x: 166, y: 70 },
        { texto: "AMPLIACION COBERTURA HOSPITALARIA 90% PLANES REGIONALES", x: 227, y: 70 },
        { texto: "0,08 UF Venta Afiliado", x: 537, y: 70 },
        { texto: "0,08", x: 669, y: 70 },
        { texto: "1327", x: 166, y: 96 },
        { texto: "FAMILIA PROTEGIDA - 5 AÑOS", x: 299, y: 96 },
        { texto: "2 UF Venta Afiliado", x: 542, y: 96 },
        { texto: "2,00", x: 669, y: 96 },
      ],
    ]);

    expect(leido.productos).toEqual([
      {
        codigo: "1336",
        nombre: "AUMENTO COBERTURA INTERNACIONAL 100 UF",
        quintoGratis: false,
        fijo: true,
        modalidad: "por_beneficiario",
        tramos: [{ edadDesde: 0, edadHasta: 120, precioUF: 0.02 }],
      },
      {
        codigo: "1277",
        nombre: "AMPLIACION COBERTURA HOSPITALARIA 90% PLANES REGIONALES",
        quintoGratis: false,
        fijo: true,
        modalidad: "por_contrato",
        tramos: [{ edadDesde: 0, edadHasta: 120, precioUF: 0.08 }],
      },
      {
        codigo: "1327",
        nombre: "FAMILIA PROTEGIDA - 5 AÑOS",
        quintoGratis: false,
        fijo: true,
        modalidad: "por_contrato",
        tramos: [{ edadDesde: 0, edadHasta: 120, precioUF: 2 }],
      },
    ]);
  });

  it("no usa la ficha del producto, que repite el código sin la columna PRECIO", () => {
    const leido = leerTarifarioVidaTres([
      [
        { texto: "PRODUCTO", x: 91, y: 47 },
        { texto: "CODIGO", x: 170, y: 47 },
        { texto: "Precio UF x Ben", x: 214, y: 47 },
        { texto: "1307", x: 177, y: 62 },
        { texto: "0,03", x: 237, y: 62 },
      ],
    ]);
    expect(leido.productos).toEqual([]);
  });

  it("lee el catastrófico por edad, con el quinto beneficiario gratis y la columna propia", () => {
    const palabras: PalabraTarifa[] = [
      { texto: "1250", x: 357, y: 33 },
      { texto: "1251", x: 634, y: 36 },
      { texto: "MULTIPRESTADOR", x: 325, y: 52 },
      { texto: "MAX", x: 359, y: 64 },
      { texto: "LIBRE ELECCION", x: 586, y: 57 },
      { texto: "MAX", x: 685, y: 57 },
      { texto: "EDAD", x: 261, y: 77 },
      { texto: "VALOR", x: 353, y: 77 },
      { texto: "EDAD", x: 597, y: 77 },
      { texto: "VALOR", x: 660, y: 77 },
      { texto: "30 dias - 18", x: 247, y: 89 },
      { texto: "0,27", x: 360, y: 89 },
      { texto: "30 dias - 18", x: 584, y: 89 },
      { texto: "0,4", x: 670, y: 89 },
      { texto: "87 - 90", x: 259, y: 225 },
      { texto: "4,60", x: 360, y: 225 },
      { texto: "88 - 90", x: 596, y: 225 },
      { texto: "7,9", x: 670, y: 225 },
      { texto: "96 o mas", x: 253, y: 250 },
      { texto: "5,00", x: 360, y: 250 },
      { texto: "96 o mas", x: 589, y: 250 },
      { texto: "9,8", x: 670, y: 250 },
      { texto: "DESDE EL 5° BENEFIARIO NO PAGA CATASTROFICO", x: 40, y: 280 },
    ];

    const leido = leerTarifarioVidaTres([palabras]);
    expect(leido.productos.map((producto) => producto.codigo)).toEqual(["1250", "1251"]);
    expect(leido.productos[0]).toMatchObject({
      nombre: "MULTIPRESTADOR MAX",
      quintoGratis: true,
      fijo: false,
      modalidad: "por_beneficiario",
      tramos: [
        { edadDesde: 0, edadHasta: 18, precioUF: 0.27 },
        { edadDesde: 87, edadHasta: 90, precioUF: 4.6 },
        { edadDesde: 96, edadHasta: 120, precioUF: 5 },
      ],
    });
    expect(leido.productos[1]?.tramos).toEqual([
      { edadDesde: 0, edadHasta: 18, precioUF: 0.4 },
      { edadDesde: 88, edadHasta: 90, precioUF: 7.9 },
      { edadDesde: 96, edadHasta: 120, precioUF: 9.8 },
    ]);
  });
});

describe("cargar el PDF de Vida Tres por el mismo camino que la app", () => {
  it("lo acepta solo en Vida Tres y en Banmédica no encuentra precio base", async () => {
    const bytes = readFileSync(PDF);
    const archivo = new File([bytes], "TARIFARIO_SANTIAGO_20_OCTUBRE_2026.pdf", { type: "application/pdf" });

    const vida = await leerArchivoTarifario("vida-tres", archivo);
    const banmedica = await leerArchivoTarifario("banmedica", archivo);

    expect(vida.ok).toBe(true);
    if (vida.ok) {
      expect(vida.leido.planes).toHaveLength(120);
      expect(vida.leido.titulo).toBe("VIDA TRES SANTIAGO OCTUBRE 2026");
    }
    expect(banmedica).toEqual({
      ok: false,
      error: "No encontré planes con precio base en ese archivo.",
      status: 422,
    });
  });
});

describe("tarifario Vida Tres de Santiago, octubre 2026", () => {
  it("carga planes y productos del PDF comercial", async () => {
    const pdf = await getDocumentProxy(new Uint8Array(readFileSync(PDF)));
    const { items } = await extractTextItems(pdf);
    const paginas: PalabraTarifa[][] = [];
    for (let i = 0; i < items.length; i++) {
      const palabras = items[i];
      if (!palabras) continue;
      const pagina = await pdf.getPage(i + 1);
      const altura = pagina.getViewport({ scale: 1 }).height;
      paginas.push(
        palabras
          .filter((item) => item.str.trim())
          .map((item) => ({
            texto: item.str.trim(),
            x: item.x,
            y: altura - item.y - item.height,
          })),
      );
    }

    const leido = leerTarifarioVidaTres(paginas);
    const plan = (codigo: string) => leido.planes.find((item) => item.codigo === codigo);
    const producto = (codigo: string) => leido.productos.find((item) => item.codigo === codigo);

    expect(leido.titulo).toBe("VIDA TRES SANTIAGO OCTUBRE 2026");
    expect(leido.planes).toHaveLength(120);
    expect(new Set(leido.planes.map((item) => item.codigo)).size).toBe(120);
    expect(leido.planes.every((item) => item.consultaUF === null)).toBe(true);
    expect(leido.planes.every((item) => item.precioBaseUF > 0 && item.precioBaseUF < 20)).toBe(true);
    expect(leido.planes.every((item) => item.linea && item.linea.length >= 8 && !item.linea.includes("%"))).toBe(true);

    expect(plan("VPLPB250611")).toMatchObject({ linea: "Vanguardia Platinum B 11/2506", precioBaseUF: 1.83 });
    expect(plan("VPRPB250633")).toMatchObject({ linea: "Vanguardia Premium Platinum B 33/2506", precioBaseUF: 2.25 });
    expect(plan("VPP260677")).toMatchObject({ precioBaseUF: 2.52 });
    expect(plan("VPRT260677")).toMatchObject({ linea: "Premium Titanium 77/2606", precioBaseUF: 2.72 });

    expect(producto("1336")).toMatchObject({ modalidad: "por_beneficiario", fijo: true });
    expect(producto("1336")?.tramos[0]?.precioUF).toBe(0.02);
    expect(producto("1277")?.modalidad).toBe("por_contrato");
    expect(producto("1327")?.tramos[0]?.precioUF).toBe(2);
    expect(producto("1487")).toBeUndefined();

    expect(producto("1250")?.tramos[0]).toEqual({ edadDesde: 0, edadHasta: 18, precioUF: 0.27 });
    expect(producto("1250")?.quintoGratis).toBe(true);
    expect(producto("1251")?.tramos.find((tramo) => tramo.edadDesde === 88)).toEqual({
      edadDesde: 88,
      edadHasta: 90,
      precioUF: 7.9,
    });
    expect(producto("1173")?.nombre).toBe("DUO");
    expect(producto("1173")?.tramos.find((tramo) => tramo.edadDesde === 60)).toEqual({
      edadDesde: 60,
      edadHasta: 69,
      precioUF: 0.85,
    });
    expect(producto("1246")?.tramos.find((tramo) => tramo.edadDesde === 70)?.precioUF).toBe(0.81);

    const fijos = leido.productos.filter((item) => item.fijo);
    const porEdad = leido.productos.filter((item) => !item.fijo);
    expect(fijos).toHaveLength(41);
    expect(porEdad.map((item) => item.codigo).sort()).toEqual(
      ["1173", "1213", "1246", "1247", "1248", "1250", "1251", "1255"].sort(),
    );
  });
});
