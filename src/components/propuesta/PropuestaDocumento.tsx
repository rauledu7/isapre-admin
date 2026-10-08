import type { ReactNode } from "react";

import { formatCLP, formatFactor, formatUF } from "@/lib/format";
import {
  desglosePlan,
  lineaDiferencia,
  lineaVariacion,
  nombreIsapre,
  NOTA_LEGAL,
  textoValorUF,
  type LineaMonto,
  type Propuesta,
} from "@/lib/propuesta";
import { formatearTelefono } from "@/lib/telefono";
import { cn } from "@/lib/utils";
import type { ResultadoDiferencia } from "@/types/isapre";

function Fila({ linea, destacado }: { linea: LineaMonto; destacado?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-1", destacado && "font-semibold")}>
      <div>
        <p className="text-sm">{linea.etiqueta}</p>
        {linea.detalle && <p className="text-xs text-muted-foreground">{linea.detalle}</p>}
      </div>
      <div className="shrink-0 text-right whitespace-nowrap tabular-nums">
        <p className="text-sm">{formatUF(linea.uf)}</p>
        <p className="text-xs font-normal text-muted-foreground">{formatCLP(linea.clp)}</p>
      </div>
    </div>
  );
}

function Seccion({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-lg border p-4">
      {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
      <h2 className="mb-2 font-semibold">{titulo}</h2>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function FilaDiferencia({ diferencia }: { diferencia: ResultadoDiferencia }) {
  const linea = lineaDiferencia(diferencia);
  if (!linea) return <p className="py-1 text-sm">Cubierto exacto por el 7% legal</p>;
  return <Fila linea={linea} destacado />;
}

export function PropuestaDocumento({ propuesta: p, fecha }: { propuesta: Propuesta; fecha: string }) {
  const { resultado, valorUF } = p;
  const legal = resultado.cotizacionLegal;
  const isapreActual = nombreIsapre(p.isapreActual);

  return (
    <article className="flex flex-col gap-4 bg-background text-foreground">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Propuesta de plan de salud</p>
          <h1 className="text-xl font-semibold">{p.clienteNombre ?? "Comparación de planes"}</h1>
          <p className="text-sm text-muted-foreground">{fecha}</p>
        </div>
        {p.asesor && (
          <div className="text-right text-sm">
            <p className="font-medium">{p.asesor.nombre}</p>
            {p.asesor.telefono && <p>{formatearTelefono(p.asesor.telefono)}</p>}
            {p.asesor.email && <p>{p.asesor.email}</p>}
          </div>
        )}
      </header>

      <Seccion titulo="Tu 7% legal" subtitulo="Cotización obligatoria de salud">
        <Fila linea={{ etiqueta: "Renta imponible", uf: legal.rentaImponibleUF, clp: legal.rentaImponibleCLP }} />
        {legal.aplicaTope && (
          <Fila
            linea={{
              etiqueta: "Renta imponible topada",
              detalle: `Tope imponible ${formatFactor(p.topeImponibleUF)} UF`,
              uf: legal.rentaTopadaUF,
              clp: legal.rentaTopadaCLP,
            }}
          />
        )}
        <Fila
          linea={{ etiqueta: "7% obligatorio", uf: legal.cotizacionLegalUF, clp: legal.cotizacionLegalCLP }}
          destacado
        />
        <p className="py-1.5 text-xs text-muted-foreground tabular-nums">
          {resultado.beneficiarios
            .map((b, i) => `${b.rol === "titular" ? "Titular" : `Carga ${i}`} ${b.edad} años (factor ${formatFactor(b.factor)})`)
            .join(" · ")}
          {` · Suma de factores ${formatFactor(resultado.sumaFactores)}`}
        </p>
      </Seccion>

      {resultado.planActual && (
        <Seccion titulo={`Plan actual${isapreActual ? ` · ${isapreActual}` : ""}`} subtitulo="Situación actual">
          <Fila
            linea={{
              etiqueta: "Precio plan actual",
              uf: resultado.planActual.precioUF,
              clp: resultado.planActual.precioCLP,
            }}
          />
          <FilaDiferencia diferencia={resultado.planActual.diferencia} />
        </Seccion>
      )}

      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        {resultado.planes.map((item, i) => {
          const variacion = lineaVariacion(item);
          const plan = item.resultado.plan;
          return (
            <Seccion
              key={item.plan.id}
              titulo={item.plan.nombre}
              subtitulo={`Propuesta ${i + 1}${nombreIsapre(item.plan.isapreId) ? ` · ${nombreIsapre(item.plan.isapreId)}` : ""}`}
            >
              {desglosePlan(item, valorUF.valor).map((l) => (
                <Fila key={l.etiqueta} linea={l} />
              ))}
              <Fila linea={{ etiqueta: "Precio final del plan", uf: plan.precioFinalUF, clp: plan.precioFinalCLP }} destacado />
              <FilaDiferencia diferencia={item.resultado.diferencia} />
              {variacion && <Fila linea={variacion} />}
            </Seccion>
          );
        })}
      </div>

      <footer className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
        <p>Valores calculados con {textoValorUF(valorUF)}.</p>
        <p>{NOTA_LEGAL}</p>
      </footer>
    </article>
  );
}
