import type { PalabraTarifa, PlanTarifa, ProductoTarifa, TarifarioLeido, TramoProducto } from "@/lib/tarifario";

/**
 * PDF comercial de Vida Tres (Santiago): precio en la columna Base,
 * catálogo de productos con precio fijo y catastróficos por edad.
 * No lee el formato de Banmédica (VB / CONS UF) ni el Excel de Nueva Masvida.
 */

const CODIGO_PLAN = /^V[A-Z]{1,9}\d{4,8}$/;
const CODIGO_PRODUCTO = /^\d{3,4}$/;

function numeroUF(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,2}([.,]\d{1,4})?$/.test(limpio)) return null;
  if (/^\d+\.\d{3}$/.test(limpio)) return null;
  const valor = Number(limpio.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0 || valor >= 30) return null;
  return Number(valor.toFixed(4));
}

function lineasDe(palabras: PalabraTarifa[]): PalabraTarifa[][] {
  const grupos: { y: number; palabras: PalabraTarifa[] }[] = [];
  for (const palabra of [...palabras].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const grupo = grupos.find((item) => Math.abs(item.y - palabra.y) <= 2.5);
    if (grupo) grupo.palabras.push(palabra);
    else grupos.push({ y: palabra.y, palabras: [palabra] });
  }
  return grupos.map((grupo) => grupo.palabras.sort((a, b) => a.x - b.x));
}

function tituloDe(paginas: PalabraTarifa[][]): string | null {
  for (const pagina of paginas) {
    for (const palabra of pagina) {
      const match = palabra.texto.match(/tarifario\s+vida\s+tres\s+(.+)/i);
      if (match?.[1]) return `VIDA TRES ${match[1].replace(/\s+/g, " ").trim()}`;
    }
  }
  return null;
}

function modalidadDe(texto: string): ProductoTarifa["modalidad"] {
  return /afiliado/i.test(texto) ? "por_contrato" : "por_beneficiario";
}

function productoFijo(
  codigo: string,
  nombre: string,
  precioUF: number,
  modalidad: ProductoTarifa["modalidad"],
): ProductoTarifa {
  return {
    codigo,
    nombre,
    tramos: [{ edadDesde: 0, edadHasta: 120, precioUF }],
    quintoGratis: false,
    fijo: true,
    modalidad,
  };
}

function leerCatalogo(palabras: PalabraTarifa[]): ProductoTarifa[] {
  const lineas = lineasDe(palabras);
  const encabezado = lineas.find(
    (linea) =>
      linea.some((palabra) => /^c[oó]digo$/i.test(palabra.texto)) &&
      linea.some((palabra) => /^producto$/i.test(palabra.texto)) &&
      linea.some((palabra) => /^precio$/i.test(palabra.texto)),
  );
  const xCodigo = encabezado?.find((palabra) => /^c[oó]digo$/i.test(palabra.texto))?.x;
  const xProducto = encabezado?.find((palabra) => /^producto$/i.test(palabra.texto))?.x;
  const yEncabezado = encabezado?.[0]?.y;
  if (xCodigo === undefined || xProducto === undefined || yEncabezado === undefined) return [];

  const productos: ProductoTarifa[] = [];
  for (const linea of lineas) {
    const y = linea[0]?.y ?? 0;
    if (y <= yEncabezado) continue;
    const codigo = linea.find((palabra) => CODIGO_PRODUCTO.test(palabra.texto) && Math.abs(palabra.x - xCodigo) < 30);
    if (!codigo) continue;
    const precios = linea.flatMap((palabra) => {
      const valor = numeroUF(palabra.texto);
      return valor === null ? [] : [{ x: palabra.x, valor }];
    });
    const precio = precios.sort((a, b) => b.x - a.x)[0];
    if (!precio) continue;
    const nombre = linea
      .filter((palabra) => palabra !== codigo && numeroUF(palabra.texto) === null)
      .sort((a, b) => Math.abs(a.x - xProducto) - Math.abs(b.x - xProducto))[0];
    productos.push(
      productoFijo(codigo.texto, nombre?.texto ?? `Producto ${codigo.texto}`, precio.valor, modalidadDe(linea.map((palabra) => palabra.texto).join(" "))),
    );
  }
  return productos;
}

function tramoEdad(texto: string): { edadDesde: number; edadHasta: number } | null {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (/\d+\s*d[ií]as\s*-\s*\d+/i.test(limpio)) {
    const hasta = Number(limpio.match(/(\d+)\s*$/)?.[1]);
    return Number.isFinite(hasta) ? { edadDesde: 0, edadHasta: hasta } : null;
  }
  const mas = limpio.match(/^(\d+)\s*o\s*m[aá]s$/i);
  if (mas?.[1]) return { edadDesde: Number(mas[1]), edadHasta: 120 };
  const rango = limpio.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!rango?.[1] || !rango[2]) return null;
  const edadDesde = Number(rango[1]);
  const edadHasta = Number(rango[2]);
  return edadDesde <= edadHasta ? { edadDesde, edadHasta } : null;
}

function leerEdades(palabras: PalabraTarifa[]): ProductoTarifa[] {
  const edades = palabras.filter((palabra) => /^edad$/i.test(palabra.texto));
  const valores = palabras.filter((palabra) => /^valor$/i.test(palabra.texto));
  if (edades.length === 0 || valores.length === 0) return [];
  const filaY = Math.min(...edades.map((palabra) => palabra.y));
  const edadesH = edades.filter((palabra) => Math.abs(palabra.y - filaY) < 6);
  const valoresH = valores.filter((palabra) => Math.abs(palabra.y - filaY) < 6);
  const codigos = palabras.filter(
    (palabra) => CODIGO_PRODUCTO.test(palabra.texto) && palabra.y < filaY - 8 && palabra.y > filaY - 90,
  );
  if (codigos.length === 0) return [];

  const libres = [...valoresH];
  const columnas = [...codigos]
    .sort((a, b) => a.x - b.x)
    .flatMap((codigo) => {
      const valor = [...libres].sort((a, b) => Math.abs(a.x - codigo.x) - Math.abs(b.x - codigo.x))[0];
      if (!valor || Math.abs(valor.x - codigo.x) > 80) return [];
      libres.splice(libres.indexOf(valor), 1);
      const edad = [...edadesH].filter((item) => item.x < valor.x - 15).sort((a, b) => b.x - a.x)[0];
      return edad ? [{ codigo, valor, edad }] : [];
    });

  const blob = palabras.map((palabra) => palabra.texto).join(" ");
  const quintoGratis = /5\s*°|quinto/i.test(blob) && /no paga|gratis/i.test(blob);

  return columnas.flatMap((columna) => {
    const nombre = palabras
      .filter((palabra) => {
        if (palabra.y <= columna.codigo.y + 2 || palabra.y >= filaY - 2) return false;
        if (CODIGO_PRODUCTO.test(palabra.texto) || /^edad$/i.test(palabra.texto) || /^valor$/i.test(palabra.texto)) {
          return false;
        }
        if (palabra.texto.length > 40) return false;
        const distancia = Math.abs(palabra.x - columna.codigo.x);
        if (distancia > 90) return false;
        return !codigos.some((otro) => otro !== columna.codigo && Math.abs(palabra.x - otro.x) < distancia);
      })
      .sort((a, b) => a.x - b.x)
      .map((palabra) => palabra.texto)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const tramos: TramoProducto[] = [];
    for (const etiqueta of palabras) {
      if (Math.abs(etiqueta.x - columna.edad.x) > 45 || etiqueta.y <= filaY) continue;
      const edad = tramoEdad(etiqueta.texto);
      if (!edad) continue;
      const precio = palabras.find(
        (palabra) => Math.abs(palabra.x - columna.valor.x) < 22 && Math.abs(palabra.y - etiqueta.y) < 3,
      );
      const precioUF = precio ? numeroUF(precio.texto) : null;
      if (precioUF === null) continue;
      if (tramos.some((tramo) => tramo.edadDesde === edad.edadDesde && tramo.edadHasta === edad.edadHasta)) continue;
      tramos.push({ ...edad, precioUF });
    }
    if (tramos.length === 0) return [];
    return [
      {
        codigo: columna.codigo.texto,
        nombre: nombre || `Producto ${columna.codigo.texto}`,
        tramos,
        quintoGratis,
        fijo: false,
        modalidad: "por_beneficiario" as const,
      },
    ];
  });
}

function lineaPlan(
  palabras: PalabraTarifa[],
  ancla: PalabraTarifa,
  headerY: number,
  codigoX: number,
  anclas: PalabraTarifa[],
): string | null {
  const linea = palabras
    .filter((palabra) => {
      if (palabra.x > codigoX - 8 || palabra.y <= headerY + 4) return false;
      if (Math.abs(palabra.y - ancla.y) > 12) return false;
      if (palabra.texto.length > 40 || /%|\bUF\b/i.test(palabra.texto)) return false;
      if (CODIGO_PLAN.test(palabra.texto)) return false;
      const distancia = Math.abs(palabra.y - ancla.y);
      return !anclas.some((otra) => otra !== ancla && Math.abs(palabra.y - otra.y) < distancia);
    })
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((palabra) => palabra.texto)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return linea || null;
}

function leerPlanes(palabras: PalabraTarifa[]): PlanTarifa[] {
  const encabezados = lineasDe(palabras).flatMap((linea) => {
    const codigo = linea.find((palabra) => /^c[oó]digo$/i.test(palabra.texto));
    const base = linea.find((palabra) => /^base$/i.test(palabra.texto));
    if (!codigo || !base || base.x <= codigo.x || base.x - codigo.x > 90) return [];
    return [{ y: codigo.y, codigoX: codigo.x, baseX: base.x }];
  });
  if (encabezados.length === 0) return [];

  const anclas = palabras.filter((palabra) => {
    if (!CODIGO_PLAN.test(palabra.texto)) return false;
    const encabezado = [...encabezados].reverse().find((item) => item.y < palabra.y);
    return encabezado !== undefined && Math.abs(palabra.x - encabezado.codigoX) < 30;
  });

  return [...anclas]
    .sort((a, b) => a.y - b.y)
    .flatMap((ancla) => {
      const encabezado = [...encabezados].reverse().find((item) => item.y < ancla.y);
      if (!encabezado) return [];
      const precio = palabras.find(
        (palabra) => Math.abs(palabra.x - encabezado.baseX) < 16 && Math.abs(palabra.y - ancla.y) < 6,
      );
      const precioBaseUF = precio ? numeroUF(precio.texto) : null;
      if (precioBaseUF === null) return [];
      return [
        {
          codigo: ancla.texto,
          linea: lineaPlan(palabras, ancla, encabezado.y, encabezado.codigoX, anclas),
          precioBaseUF,
          consultaUF: null,
        },
      ];
    });
}

/** Planes y productos del tarifario comercial de Vida Tres. Ignora factores, GES y regalados. */
export function leerTarifarioVidaTres(paginas: PalabraTarifa[][]): TarifarioLeido {
  const planes: PlanTarifa[] = [];
  const vistos = new Set<string>();
  const productos = new Map<string, ProductoTarifa>();

  for (const pagina of paginas) {
    for (const plan of leerPlanes(pagina)) {
      if (vistos.has(plan.codigo)) continue;
      vistos.add(plan.codigo);
      planes.push(plan);
    }
    for (const producto of leerCatalogo(pagina)) {
      if (!productos.has(producto.codigo)) productos.set(producto.codigo, producto);
    }
    for (const producto of leerEdades(pagina)) productos.set(producto.codigo, producto);
  }

  return {
    titulo: tituloDe(paginas),
    planes,
    productos: [...productos.values()].filter((producto) => producto.tramos.length > 0),
  };
}
