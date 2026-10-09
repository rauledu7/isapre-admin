"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { parseEntero } from "@/lib/format";
import { precioProducto, type ProductoTarifa } from "@/lib/tarifario";
import type { TarifarioGuardado } from "@/lib/supabase/tarifarios";
import { useCotizadorStore } from "@/store/cotizadorStore";
import type { PlanForm } from "@/types/cotizador";

function textoUF(valor: number): string {
  return valor.toLocaleString("es-CL", { maximumFractionDigits: 4, useGrouping: false });
}

function frase(texto: string): string {
  const limpio = texto.toLocaleLowerCase("es-CL");
  return limpio.charAt(0).toLocaleUpperCase("es-CL") + limpio.slice(1);
}

function SelectorProductos({
  planId,
  productos,
  marcados,
  edades,
  sinPrecio,
  incluyeConsulta,
  onChange,
}: {
  planId: string;
  productos: ProductoTarifa[];
  marcados: string[];
  edades: number[];
  sinPrecio: number[];
  incluyeConsulta: boolean;
  onChange: (cambios: Partial<Omit<PlanForm, "id">>) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const elegidos = productos.filter((producto) => marcados.includes(producto.codigo));
  const resumen =
    elegidos.length === 0 ? "Ninguno" : elegidos.map((producto) => frase(producto.nombre)).join(", ");

  useEffect(() => {
    if (!abierto) return;
    function cerrar(evento: MouseEvent) {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  function marcar(codigo: string, activo: boolean) {
    const siguientes = activo ? [...marcados, codigo] : marcados.filter((item) => item !== codigo);
    onChange({
      productosTarifa: siguientes,
      ...(siguientes.length === 0 && !incluyeConsulta ? { seguroUF: "" } : {}),
    });
  }

  return (
    <div ref={caja} className="relative flex flex-col gap-1.5">
      <Label htmlFor={`productos-${planId}`}>Productos adicionales</Label>
      <button
        id={`productos-${planId}`}
        type="button"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border bg-transparent px-2 text-left text-sm"
        onClick={() => setAbierto((valor) => !valor)}
      >
        <span className="truncate">{resumen}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute top-full z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {productos.map((producto) => {
            const activo = marcados.includes(producto.codigo);
            const parcial = edades.length > 0 ? precioProducto(producto, edades) : null;
            return (
              <li key={producto.codigo}>
                <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={activo}
                    onChange={(e) => marcar(producto.codigo, e.target.checked)}
                  />
                  <span>
                    {frase(producto.nombre)} ({producto.codigo})
                    {parcial && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {textoUF(parcial.totalUF)} UF
                        {producto.quintoGratis ? " · desde el 5.º, el más barato no se cobra" : ""}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {sinPrecio.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Sin precio para {sinPrecio.join(", ")} años en el producto marcado.
        </p>
      )}
    </div>
  );
}

export function TarifarioPlan({
  plan,
  tarifario,
  onChange,
}: {
  plan: PlanForm;
  tarifario: TarifarioGuardado | null;
  onChange: (cambios: Partial<Omit<PlanForm, "id">>) => void;
}) {
  const edadTitular = useCotizadorStore((s) => s.cliente.edadTitular);
  const cargas = useCotizadorStore((s) => s.cargas);
  const edades = useMemo(() => {
    const titular = parseEntero(edadTitular);
    const lista = titular === null ? [] : [titular];
    for (const carga of cargas) {
      const edad = parseEntero(carga.edad);
      if (edad !== null) lista.push(edad);
    }
    return lista;
  }, [edadTitular, cargas]);

  const elegido = tarifario?.planes.find((item) => item.codigo === plan.codigoTarifa) ?? null;
  const marcados = plan.productosTarifa ?? [];
  const incluyeConsulta = plan.incluyeConsulta ?? false;
  const productos = tarifario?.productos.filter((item) => marcados.includes(item.codigo)) ?? [];
  const sinPrecio = productos.flatMap((item) => precioProducto(item, edades).sinPrecio);
  const claveEdades = edades.join(",");
  const claveProductos = marcados.join(",");

  useEffect(() => {
    if (!tarifario) return;
    const planElegido = tarifario.planes.find((item) => item.codigo === plan.codigoTarifa);
    const activos = tarifario.productos.filter((item) => (plan.productosTarifa ?? []).includes(item.codigo));
    const consulta = plan.incluyeConsulta && planElegido?.consultaUF ? planElegido.consultaUF : 0;
    if (!plan.incluyeConsulta && activos.length === 0) return;
    const edadesActuales = claveEdades === "" ? [] : claveEdades.split(",").map(Number);
    const total =
      consulta + activos.reduce((acc, item) => acc + precioProducto(item, edadesActuales).totalUF, 0);
    onChange({ seguroUF: textoUF(total) });
    // onChange escribe el total cuando cambian las edades o la selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveEdades, claveProductos, incluyeConsulta, plan.codigoTarifa, tarifario]);

  if (!tarifario || tarifario.planes.length === 0) return null;

  const grupos = new Map<string, typeof tarifario.planes>();
  for (const item of tarifario.planes) {
    const linea = item.linea ?? "Otros";
    grupos.set(linea, [...(grupos.get(linea) ?? []), item]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`tarifa-${plan.id}`}>Plan del tarifario</Label>
        <select
          id={`tarifa-${plan.id}`}
          className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm"
          value={plan.codigoTarifa ?? ""}
          onChange={(e) => {
            const codigo = e.target.value;
            const item = tarifario.planes.find((planItem) => planItem.codigo === codigo);
            if (!item) {
              onChange({ codigoTarifa: null });
              return;
            }
            onChange({
              codigoTarifa: item.codigo,
              nombre: item.linea ? `${frase(item.linea)} (${item.codigo})` : item.codigo,
              precioBaseUF: textoUF(item.precioBaseUF),
              productosTarifa: [],
              incluyeConsulta: false,
              seguroUF: "",
            });
          }}
        >
          <option value="">Elegir plan</option>
          {[...grupos.entries()].map(([linea, items]) => (
            <optgroup key={linea} label={frase(linea)}>
              {items.map((item) => (
                <option key={item.codigo} value={item.codigo}>
                  {item.codigo} · {textoUF(item.precioBaseUF)} UF
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {elegido?.consultaUF != null && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={incluyeConsulta}
            onChange={(e) => onChange({ incluyeConsulta: e.target.checked, ...(e.target.checked ? {} : marcados.length === 0 ? { seguroUF: "" } : {}) })}
          />
          Consulta {textoUF(elegido.consultaUF)} UF por contrato
        </label>
      )}

      {tarifario.productos.length > 0 && (
        <SelectorProductos
          planId={plan.id}
          productos={tarifario.productos}
          marcados={marcados}
          edades={edades}
          sinPrecio={sinPrecio}
          incluyeConsulta={incluyeConsulta}
          onChange={onChange}
        />
      )}
    </div>
  );
}
