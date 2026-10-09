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
  /** Precio único, sin tramo de edad. */
  fijo?: boolean;
  /** `por_contrato` se cobra una vez. `por_beneficiario` se multiplica por las edades. */
  modalidad?: "por_beneficiario" | "por_contrato";
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
  return Number.isFinite(valor) && valor > 0 && valor < 30 ? valor : null;
}

function enteroColumna(texto: string): number | null {
  if (!/^\d{1,2}$/.test(texto)) return null;
  const valor = Number(texto);
  return valor > 0 && valor < 30 ? valor : null;
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

interface ColumnasPlan {
  codigoX: number;
  baseX: number;
  consultaX: number | null;
}

function etiquetaCodigo(texto: string): boolean {
  return /^c[oó]digos?$/i.test(texto.trim());
}

function etiquetaBase(texto: string): boolean {
  return /^(vb|v\.b\.)$/i.test(texto.replace(/\s/g, ""));
}

function etiquetaConsulta(texto: string): boolean {
  return /^cons(\s*uf)?$/i.test(texto.trim());
}

function columnasPlan(linea: PalabraTarifa[]): ColumnasPlan | null {
  const codigo = linea.find((palabra) => etiquetaCodigo(palabra.texto));
  const base = linea.find((palabra) => etiquetaBase(palabra.texto));
  if (!codigo || !base || base.x <= codigo.x) return null;
  const consulta = linea.find((palabra) => etiquetaConsulta(palabra.texto) && palabra.x > base.x);
  return { codigoX: codigo.x, baseX: base.x, consultaX: consulta?.x ?? null };
}

function precioCerca(
  linea: PalabraTarifa[],
  x: number,
  tolerancia: number,
  entero: boolean,
  lejosDe?: number,
): number | null {
  let mejor: { distancia: number; valor: number } | null = null;
  for (const palabra of linea) {
    const distancia = Math.abs(palabra.x - x);
    if (distancia > tolerancia) continue;
    if (lejosDe !== undefined && Math.abs(palabra.x - lejosDe) <= distancia) continue;
    const valor = numeroUF(palabra.texto) ?? (entero ? enteroColumna(palabra.texto) : null);
    if (valor === null || (mejor && distancia >= mejor.distancia)) continue;
    mejor = { distancia, valor };
  }
  return mejor?.valor ?? null;
}

function precioEntre(linea: PalabraTarifa[], xMin: number, xMax: number): number | null {
  for (const palabra of linea) {
    if (palabra.x < xMin || palabra.x >= xMax) continue;
    const valor = numeroUF(palabra.texto);
    if (valor !== null) return valor;
  }
  return null;
}

function trozos(linea: PalabraTarifa[], hueco = 36): PalabraTarifa[][] {
  const grupos: PalabraTarifa[][] = [];
  for (const palabra of [...linea].sort((a, b) => a.x - b.x)) {
    const ultimo = grupos.at(-1);
    const previo = ultimo?.at(-1);
    if (!ultimo || !previo || palabra.x - (previo.x + previo.texto.length * 4) > hueco) grupos.push([palabra]);
    else ultimo.push(palabra);
  }
  return grupos;
}

function esEncabezadoProducto(linea: string): boolean {
  const limpio = linea.trim();
  if (limpio.length < 18 || limpio.length > 80 || !limpio.includes(" ")) return false;
  if (/\d{3,5}/.test(limpio) || /\d[.,]\d/.test(limpio)) return false;
  if (/^(cod|c[oó]digo|valor|condiciones|tope|precio|por beneficiario|cualquier plan)\b/i.test(limpio)) return false;
  const letras = limpio.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  if (letras.length < 8) return false;
  const mayusculas = letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length;
  return mayusculas >= letras.length * 0.7;
}

function precioProductoPlano(texto: string): { valor: number; modalidad: ProductoTarifa["modalidad"] | null } | null {
  const match = texto.match(/(\d{1,2}[.,]\d{1,4})/);
  if (!match?.[1]) return null;
  const valor = numeroUF(match[1]);
  if (valor === null) return null;
  if (/familia|g\.\s*f|grupo/i.test(texto)) return { valor, modalidad: "por_contrato" };
  if (/benef/i.test(texto)) return { valor, modalidad: "por_beneficiario" };
  return { valor, modalidad: null };
}

function modalidadDe(textos: string[]): ProductoTarifa["modalidad"] {
  const blob = textos.join(" ");
  const familia = /familia|g\.\s*f|grupo/i.test(blob);
  const benef = /benef/i.test(blob);
  if (familia && !benef) return "por_contrato";
  if (benef && !familia) return "por_beneficiario";
  return "por_contrato";
}

function guardarPlano(
  productos: Map<string, ProductoTarifa>,
  codigo: string,
  nombre: string,
  valor: number,
  modalidad: ProductoTarifa["modalidad"],
) {
  const anterior = productos.get(codigo);
  if (anterior && !anterior.fijo && anterior.tramos.length > 0) return;
  productos.set(codigo, {
    codigo,
    nombre: anterior?.nombre && anterior.nombre !== `Producto ${codigo}` ? anterior.nombre : nombre,
    tramos: [{ edadDesde: 0, edadHasta: 120, precioUF: valor }],
    quintoGratis: false,
    fijo: true,
    modalidad,
  });
}

/** Planes (código, precio base, consulta) y productos del bloque Productos adicionales. */
export function leerTarifario(paginas: PalabraTarifa[][]): TarifarioLeido {
  const planes: PlanTarifa[] = [];
  const vistos = new Set<string>();
  const productos = new Map<string, ProductoTarifa>();
  let titulo: string | null = null;
  let lineaActual: string | null = null;
  let productoActual: string | null = null;
  let preciosDe: string | null = null;
  let columnas: ColumnasPlan | null = null;
  let enProductos = false;

  for (const pagina of paginas) {
    const lineas = lineasDe(pagina);
    const titulos = lineas.flatMap((linea) => {
      const escrito = texto(linea).replace(/\s+/g, " ").trim();
      return esTitulo(escrito) && linea[0] ? [{ y: linea[0].y, texto: escrito }] : [];
    });
    const encabezados = lineas.flatMap((linea) => {
      const columnasLinea = columnasPlan(linea);
      return columnasLinea && linea[0] ? [{ y: linea[0].y, columnas: columnasLinea }] : [];
    });
    const titulosProducto = lineas.flatMap((linea) =>
      trozos(linea).flatMap((trozo) => {
        const escrito = texto(trozo).replace(/\s+/g, " ").trim();
        return esEncabezadoProducto(escrito) && trozo[0] ? [{ y: trozo[0].y, x: trozo[0].x, texto: escrito }] : [];
      }),
    );
    const lineaEn = (y: number) => {
      let actual = lineaActual;
      for (const tituloPlan of titulos) {
        if (tituloPlan.y < y) actual = tituloPlan.texto;
      }
      return actual;
    };
    const columnasEn = (y: number) => {
      let actual = columnas;
      for (const encabezado of encabezados) {
        if (encabezado.y <= y + 2) actual = encabezado.columnas;
      }
      return actual;
    };

    const codigos = lineas.flatMap((linea) => {
      const codigo = linea.find((palabra) => CODIGO_PLAN.test(palabra.texto));
      if (!codigo) return [];
      const activas = columnasEn(codigo.y);
      if (!activas || Math.abs(codigo.x - activas.codigoX) > 45 || codigo.x >= activas.baseX) return [];
      return [{ y: codigo.y, x: codigo.x, codigo: codigo.texto, columnas: activas }];
    });

    codigos.forEach((ancla, orden) => {
      if (vistos.has(ancla.codigo)) return;
      const activas = ancla.columnas;
      const siguiente = codigos[orden + 1];
      const yMax = Math.min(siguiente ? siguiente.y - 2 : ancla.y + 22, ancla.y + 22);
      const ventana = lineas.filter((linea) => {
        const y = linea[0]?.y ?? 0;
        return y >= ancla.y - 2 && y <= yMax;
      });
      const precioBaseUF = ventana
        .map((linea) => precioCerca(linea, activas.baseX, 22, true))
        .find((valor) => valor !== null);
      if (precioBaseUF === undefined || precioBaseUF === null) return;
      const consultaUF = activas.consultaX
        ? (ventana
            .map((linea) => precioCerca(linea, activas.consultaX ?? 0, 22, false, activas.baseX))
            .find((valor) => valor !== null) ?? null)
        : (ventana.map((linea) => precioEntre(linea, activas.baseX + 16, activas.baseX + 55)).find((valor) => valor !== null) ??
          null);
      vistos.add(ancla.codigo);
      planes.push({
        codigo: ancla.codigo,
        linea: lineaEn(ancla.y),
        precioBaseUF,
        consultaUF,
      });
    });
    const ultimoEncabezado = encabezados.at(-1);
    if (ultimoEncabezado) columnas = ultimoEncabezado.columnas;
    const ultimoTitulo = titulos.at(-1);
    if (ultimoTitulo) lineaActual = ultimoTitulo.texto;

    for (const linea of lineas) {
      const escrito = texto(linea);
      titulo ??= tituloTarifario(escrito);
      if (/productos\s+adicionales/i.test(escrito)) enProductos = true;
      if (esTitulo(escrito)) lineaActual = escrito.replace(/\s+/g, " ").trim();

      const producto = nombreProducto(escrito);
      if (producto && !/precios/i.test(escrito)) {
        productoActual = producto.codigo;
        preciosDe = null;
        const anterior = productos.get(producto.codigo);
        productos.set(producto.codigo, {
          codigo: producto.codigo,
          nombre: producto.nombre,
          tramos: anterior?.fijo ? [] : (anterior?.tramos ?? []),
          quintoGratis: anterior?.quintoGratis ?? false,
          fijo: false,
          modalidad: "por_beneficiario",
        });
      }
      if (productoActual && /quinto\s+beneficiario\s+es\s+gratis/i.test(escrito)) {
        const actual = productos.get(productoActual);
        if (actual) actual.quintoGratis = true;
      }
      const precios = escrito.match(/precios\s+\S+\s+(\d{3,5})/i);
      if (precios?.[1]) preciosDe = precios[1];
      if (preciosDe) {
        const edad = tramoEdad(escrito);
        const precioUF = edad ? precioEn(linea) : null;
        if (edad && precioUF !== null) {
          const actual = productos.get(preciosDe) ?? {
            codigo: preciosDe,
            nombre: `Producto ${preciosDe}`,
            tramos: [],
            quintoGratis: false,
            fijo: false,
            modalidad: "por_beneficiario" as const,
          };
          actual.fijo = false;
          if (!actual.tramos.some((tramo) => tramo.edadDesde === edad.edadDesde && tramo.edadHasta === edad.edadHasta)) {
            actual.tramos.push({ ...edad, precioUF });
          }
          productos.set(preciosDe, actual);
        }
      }

      if (!enProductos || /precios\s+\S+\s+\d|c[oó]digo\s+\d{3,5}|catastr[oó]fico/i.test(escrito)) continue;
      const anclas = linea.filter((palabra) => /^\d{3,5}$/.test(palabra.texto));
      const y = linea[0]?.y ?? 0;
      anclas.forEach((ancla, orden) => {
        const siguiente = anclas[orden + 1];
        const zona = linea.filter(
          (palabra) => palabra.x > ancla.x && palabra.x < (siguiente?.x ?? ancla.x + 220),
        );
        const precio = zona.map((palabra) => precioProductoPlano(palabra.texto)).find((item) => item !== null);
        if (!precio) return;
        const tituloCerca = [...titulosProducto].reverse().find((item) => item.y < y - 6 && Math.abs(item.x - ancla.x) < 140);
        const textos = [tituloCerca?.texto ?? "", ...zona.map((palabra) => palabra.texto)];
        guardarPlano(
          productos,
          ancla.texto,
          tituloCerca?.texto ?? `Producto ${ancla.texto}`,
          precio.valor,
          precio.modalidad ?? modalidadDe(textos),
        );
      });
    }
  }

  return {
    titulo,
    planes,
    productos: [...productos.values()].filter((producto) => producto.tramos.length > 0),
  };
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Elige el plan del tarifario que corresponde al PDF: primero por código, si no por la línea. */
export function buscarPlanEnTarifario(
  planes: PlanTarifa[],
  busqueda: { codigo: string | null; nombre: string | null },
): PlanTarifa | null {
  const codigo = busqueda.codigo?.trim().toUpperCase();
  if (codigo) {
    const porCodigo = planes.find((plan) => plan.codigo.toUpperCase() === codigo);
    if (porCodigo) return porCodigo;
  }

  const nombre = busqueda.nombre ? normalizar(busqueda.nombre) : "";
  if (!nombre) return null;

  const porLinea = planes.filter((plan) => {
    if (!plan.linea) return false;
    const nucleo = normalizar(plan.linea.split("(")[0] ?? plan.linea);
    return nucleo.length >= 8 && nombre.includes(nucleo);
  });
  porLinea.sort((a, b) => normalizar(b.linea ?? "").length - normalizar(a.linea ?? "").length);
  const mejor = porLinea[0];
  const segundo = porLinea[1];
  if (!mejor) return null;
  if (segundo && normalizar(segundo.linea ?? "").length === normalizar(mejor.linea ?? "").length) return null;
  return mejor;
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
  if (producto.fijo) {
    const precio = producto.tramos[0]?.precioUF ?? 0;
    const veces = producto.modalidad === "por_beneficiario" ? edades.length : 1;
    return { totalUF: precio * veces, sinPrecio: [] };
  }
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
