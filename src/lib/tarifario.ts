import type { IsapreId } from "@/types/isapre";

/** Palabra del PDF. `y` crece hacia abajo. */
export interface PalabraTarifa {
  texto: string;
  x: number;
  y: number;
}

export interface PlanTarifa {
  codigo: string;
  linea: string | null;
  precioBaseUF: number;
  /** Columna CONS UF del plan. `null` si el tarifario no la trae. */
  consultaUF: number | null;
}

export interface TramoProducto {
  edadDesde: number;
  edadHasta: number;
  precioUF: number;
}

export interface ProductoTarifa {
  codigo: string;
  nombre: string;
  tramos: TramoProducto[];
  /** Desde el quinto beneficiario, el más barato no se cobra. */
  quintoGratis: boolean;
}

export interface TarifarioLeido {
  titulo: string | null;
  planes: PlanTarifa[];
  productos: ProductoTarifa[];
}

const CODIGO_PLAN = /^[A-Z]{2,8}\d{4,8}$/;

function numeroUF(texto: string): number | null {
  if (!/^\d{1,2}[.,]\d{1,4}$/.test(texto)) return null;
  if (/^\d+\.\d{3}$/.test(texto)) return null;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor < 30 ? valor : null;
}

function lineasDe(palabras: PalabraTarifa[]): PalabraTarifa[][] {
  const grupos: { y: number; palabras: PalabraTarifa[] }[] = [];
  for (const palabra of [...palabras].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const grupo = grupos.find((item) => Math.abs(item.y - palabra.y) <= 3);
    if (grupo) grupo.palabras.push(palabra);
    else grupos.push({ y: palabra.y, palabras: [palabra] });
  }
  return grupos.map((grupo) => grupo.palabras.sort((a, b) => a.x - b.x));
}

function texto(linea: PalabraTarifa[]): string {
  return linea.map((palabra) => palabra.texto).join(" ");
}

function esTitulo(linea: string): boolean {
  const limpio = linea.trim();
  if (limpio.length < 8 || limpio.length > 60 || !limpio.includes(" ")) return false;
  if (/tarifario|tabla|factor|codigo|consulta|hospital|copago|tramo|precio|ges|isapre/i.test(limpio)) {
    return false;
  }
  const letras = limpio.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "");
  return letras.length >= limpio.length * 0.75 && limpio === limpio.toUpperCase();
}

function tituloTarifario(linea: string): string | null {
  const match = linea.match(/tarifario\s+(.+)/i);
  return match?.[1]?.trim() || null;
}

function nombreProducto(linea: string): { codigo: string; nombre: string } | null {
  const match = linea.match(/c[oó]digo\s+(\d{3,5})/i);
  if (!match?.[1]) return null;
  const nombre = linea
    .slice(0, match.index)
    .replace(/^\d+\s*[.\-–]*\s*/, "")
    .replace(/^[-–]\s*/, "")
    .replace(/[-–]\s*$/, "")
    .trim();
  return { codigo: match[1], nombre: nombre || `Producto ${match[1]}` };
}

function tramoEdad(linea: string): { edadDesde: number; edadHasta: number } | null {
  if (/30\s*d[ií]as\s*-\s*18/i.test(linea)) return { edadDesde: 0, edadHasta: 18 };
  const rango = linea.match(/(\d+)\s*-\s*(\d+)\s*a[nñ]os/i);
  if (!rango?.[1] || !rango[2]) return null;
  const edadDesde = Number(rango[1]);
  const edadHasta = Number(rango[2]);
  return edadDesde <= edadHasta ? { edadDesde, edadHasta } : null;
}

function precioEn(linea: PalabraTarifa[]): number | null {
  const candidatos = linea.flatMap((palabra) => {
    if (palabra.x <= 160) return [];
    const propio = numeroUF(palabra.texto);
    if (propio !== null) return [{ x: palabra.x, valor: propio }];
    const embebido = palabra.texto.match(/(\d{1,2}[.,]\d{1,4})\s*UF/i);
    const valor = embebido?.[1] ? numeroUF(embebido[1]) : null;
    return valor === null ? [] : [{ x: palabra.x, valor }];
  });
  return candidatos.sort((a, b) => b.x - a.x)[0]?.valor ?? null;
}

function decimalEn(linea: PalabraTarifa[], xMin: number, xMax: number): number | null {
  for (const palabra of linea) {
    if (palabra.x < xMin || palabra.x >= xMax) continue;
    const valor = numeroUF(palabra.texto);
    if (valor !== null) return valor;
  }
  return null;
}

/** Planes (código, precio base, consulta) y productos con precio por edad. */
export function leerTarifario(paginas: PalabraTarifa[][]): TarifarioLeido {
  const planes: PlanTarifa[] = [];
  const vistos = new Set<string>();
  const productos = new Map<string, ProductoTarifa>();
  let titulo: string | null = null;
  let lineaActual: string | null = null;
  let productoActual: string | null = null;
  let preciosDe: string | null = null;

  for (const pagina of paginas) {
    const lineas = lineasDe(pagina);
    const titulos = lineas.flatMap((linea) => {
      const escrito = texto(linea).replace(/\s+/g, " ").trim();
      return esTitulo(escrito) && linea[0] ? [{ y: linea[0].y, texto: escrito }] : [];
    });
    const lineaEn = (y: number) => {
      let actual = lineaActual;
      for (const titulo of titulos) {
        if (titulo.y < y) actual = titulo.texto;
      }
      return actual;
    };
    const codigos = lineas.flatMap((linea) => {
      const codigo = linea.find((palabra) => CODIGO_PLAN.test(palabra.texto) && palabra.x < 90);
      return codigo ? [{ y: codigo.y, codigo: codigo.texto }] : [];
    });

    codigos.forEach((ancla, orden) => {
      if (vistos.has(ancla.codigo)) return;
      const siguiente = codigos[orden + 1];
      const yMax = Math.min(siguiente ? siguiente.y - 2 : ancla.y + 22, ancla.y + 22);
      const ventana = lineas.filter((linea) => {
        const y = linea[0]?.y ?? 0;
        return y >= ancla.y - 2 && y <= yMax;
      });
      const precioBaseUF = ventana.map((linea) => decimalEn(linea, 90, 122)).find((valor) => valor !== null);
      if (precioBaseUF === undefined || precioBaseUF === null) return;
      const consultaUF = ventana.map((linea) => decimalEn(linea, 122, 170)).find((valor) => valor !== null) ?? null;
      vistos.add(ancla.codigo);
      planes.push({
        codigo: ancla.codigo,
        linea: lineaEn(ancla.y),
        precioBaseUF,
        consultaUF,
      });
    });
    const ultimoTitulo = titulos.at(-1);
    if (ultimoTitulo) lineaActual = ultimoTitulo.texto;

    for (const linea of lineas) {
      const escrito = texto(linea);
      titulo ??= tituloTarifario(escrito);
      if (esTitulo(escrito)) lineaActual = escrito.replace(/\s+/g, " ").trim();

      const producto = nombreProducto(escrito);
      if (producto && !/precios/i.test(escrito)) {
        productoActual = producto.codigo;
        preciosDe = null;
        const anterior = productos.get(producto.codigo);
        productos.set(producto.codigo, {
          codigo: producto.codigo,
          nombre: producto.nombre,
          tramos: anterior?.tramos ?? [],
          quintoGratis: anterior?.quintoGratis ?? false,
        });
      }
      if (productoActual && /quinto\s+beneficiario\s+es\s+gratis/i.test(escrito)) {
        const actual = productos.get(productoActual);
        if (actual) actual.quintoGratis = true;
      }
      const precios = escrito.match(/precios\s+\S+\s+(\d{3,5})/i);
      if (precios?.[1]) preciosDe = precios[1];
      if (!preciosDe) continue;
      const edad = tramoEdad(escrito);
      const precioUF = edad ? precioEn(linea) : null;
      if (!edad || precioUF === null) continue;
      const actual = productos.get(preciosDe) ?? {
        codigo: preciosDe,
        nombre: `Producto ${preciosDe}`,
        tramos: [],
        quintoGratis: false,
      };
      if (!actual.tramos.some((tramo) => tramo.edadDesde === edad.edadDesde && tramo.edadHasta === edad.edadHasta)) {
        actual.tramos.push({ ...edad, precioUF });
      }
      productos.set(preciosDe, actual);
    }
  }

  return {
    titulo,
    planes,
    productos: [...productos.values()].filter((producto) => producto.tramos.length > 0),
  };
}

export function precioTramo(producto: ProductoTarifa, edad: number): number | null {
  const tramo = producto.tramos.find((item) => edad >= item.edadDesde && edad <= item.edadHasta);
  return tramo?.precioUF ?? null;
}

/** Suma el precio del producto para cada edad. Sin tramo, la edad queda en `sinPrecio`. */
export function precioProducto(
  producto: ProductoTarifa,
  edades: number[],
): { totalUF: number; sinPrecio: number[] } {
  const precios: number[] = [];
  const sinPrecio: number[] = [];
  for (const edad of edades) {
    const precio = precioTramo(producto, edad);
    if (precio === null) sinPrecio.push(edad);
    else precios.push(precio);
  }
  precios.sort((a, b) => b - a);
  const cobrados = producto.quintoGratis ? precios.slice(0, 4) : precios;
  return {
    totalUF: cobrados.reduce((acc, precio) => acc + precio, 0),
    sinPrecio,
  };
}
