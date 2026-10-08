"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TABLA_FACTORES } from "@/config/isapres";
import { resolverFactor } from "@/lib/calculators/factores";
import { EDAD_MAXIMA } from "@/lib/cotizadorForm";
import { formatEnteroInput, formatFactor, parseEntero } from "@/lib/format";
import { useCotizadorStore } from "@/store/cotizadorStore";
import type { RolBeneficiario } from "@/types/isapre";

import { Campo } from "./Campo";
import { IsapreSelect } from "./IsapreSelect";

function textoFactor(rol: RolBeneficiario, edadTexto: string): string | undefined {
  const edad = parseEntero(edadTexto);
  if (!TABLA_FACTORES || edad === null || edad > EDAD_MAXIMA) return undefined;
  return `Factor ${formatFactor(resolverFactor(TABLA_FACTORES, rol, edad))}`;
}

const soloDigitos = (valor: string) => valor.replace(/\D/g, "").slice(0, 3);

export function DatosClienteCard() {
  const cliente = useCotizadorStore((s) => s.cliente);
  const cargas = useCotizadorStore((s) => s.cargas);
  const actualizarCliente = useCotizadorStore((s) => s.actualizarCliente);
  const agregarCarga = useCotizadorStore((s) => s.agregarCarga);
  const actualizarCarga = useCotizadorStore((s) => s.actualizarCarga);
  const eliminarCarga = useCotizadorStore((s) => s.eliminarCarga);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del cliente</CardTitle>
        <CardDescription>Renta imponible, titular y cargas familiares.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Campo
          label="Renta imponible"
          sufijo="CLP"
          inputMode="numeric"
          placeholder="1.800.000"
          value={cliente.rentaImponibleCLP}
          onChange={(e) =>
            actualizarCliente({ rentaImponibleCLP: formatEnteroInput(e.target.value) })
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Edad titular"
            sufijo="años"
            inputMode="numeric"
            placeholder="38"
            value={cliente.edadTitular}
            onChange={(e) => actualizarCliente({ edadTitular: soloDigitos(e.target.value) })}
            ayuda={textoFactor("titular", cliente.edadTitular)}
          />
          <IsapreSelect
            label="Isapre actual"
            value={cliente.isapreActual}
            onChange={(isapreActual) => actualizarCliente({ isapreActual })}
            opcionNula="Sin Isapre actual"
            placeholder="Sin Isapre actual"
          />
        </div>

        <Campo
          label="Precio plan actual (opcional)"
          sufijo="UF"
          inputMode="decimal"
          placeholder="4,2500"
          value={cliente.precioPlanActualUF}
          onChange={(e) => actualizarCliente({ precioPlanActualUF: e.target.value })}
          ayuda="Precio total mensual del plan vigente, para comparar con la propuesta."
        />

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Cargas <span className="text-muted-foreground">({cargas.length})</span>
            </p>
            <Button variant="outline" size="sm" onClick={agregarCarga}>
              <PlusIcon /> Agregar carga
            </Button>
          </div>

          {cargas.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin cargas: solo el titular.</p>
          )}

          {cargas.map((carga, i) => (
            <div key={carga.id} className="flex items-start gap-2">
              <Campo
                className="flex-1"
                label={`Edad carga ${i + 1}`}
                sufijo="años"
                inputMode="numeric"
                placeholder="10"
                value={carga.edad}
                onChange={(e) => actualizarCarga(carga.id, soloDigitos(e.target.value))}
                ayuda={textoFactor("carga", carga.edad)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="mt-6"
                aria-label={`Eliminar carga ${i + 1}`}
                onClick={() => eliminarCarga(carga.id)}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
