"use client";

import { useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { parseEntero } from "@/lib/format";
import { precioProducto } from "@/lib/tarifario";
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
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">Productos adicionales</legend>
          {tarifario.productos.map((producto) => {
            const activo = marcados.includes(producto.codigo);
            const parcial = edades.length > 0 ? precioProducto(producto, edades) : null;
            return (
              <label key={producto.codigo} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={activo}
                  onChange={(e) => {
                    const siguientes = e.target.checked
                      ? [...marcados, producto.codigo]
                      : marcados.filter((codigo) => codigo !== producto.codigo);
                    onChange({
                      productosTarifa: siguientes,
                      ...(siguientes.length === 0 && !incluyeConsulta ? { seguroUF: "" } : {}),
                    });
                  }}
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
            );
          })}
          {sinPrecio.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Sin precio para {sinPrecio.join(", ")} años en el producto marcado.
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}
