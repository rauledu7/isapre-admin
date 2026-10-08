import type {
  Beneficiario,
  Carga,
  RolBeneficiario,
  TablaFactores,
} from "@/types/isapre";

export function resolverFactor(
  tabla: TablaFactores,
  rol: RolBeneficiario,
  edad: number,
): number {
  if (!Number.isInteger(edad) || edad < 0) {
    throw new RangeError("edad debe ser un entero no negativo");
  }

  const tramo = tabla.tramos.find(
    (t) => edad >= t.edadDesde && (t.edadHasta === null || edad < t.edadHasta),
  );
  if (!tramo) {
    throw new RangeError(
      `La tabla "${tabla.nombre}" no tiene tramo para edad ${edad}`,
    );
  }
  return tramo.factores[rol];
}

export interface EntradaGrupoFamiliar {
  edadTitular: number;
  factorManualTitular?: number;
  cargas: Carga[];
}

/** Resuelve el factor de cada beneficiario; el factor manual tiene prioridad sobre la tabla. */
export function resolverBeneficiarios(
  tabla: TablaFactores | null,
  { edadTitular, factorManualTitular, cargas }: EntradaGrupoFamiliar,
): Beneficiario[] {
  const resolver = (
    rol: RolBeneficiario,
    edad: number,
    manual: number | undefined,
  ): number => {
    if (manual !== undefined) return manual;
    if (!tabla) {
      throw new Error(
        "No hay Tabla de Factores configurada; ingresa el factor manualmente",
      );
    }
    return resolverFactor(tabla, rol, edad);
  };

  return [
    {
      rol: "titular",
      edad: edadTitular,
      factor: resolver("titular", edadTitular, factorManualTitular),
    },
    ...cargas.map((c) => ({
      rol: "carga" as const,
      edad: c.edad,
      factor: resolver("carga", c.edad, c.factorManual),
    })),
  ];
}
