import { describe, expect, it } from "vitest";

import { alertasProgramadas, type ProspectoAlerta } from "./alertas";
import { instanteEnChile } from "./fecha";

const etapas = [
  { id: "abierta", tipo: "abierta" as const },
  { id: "ganada", tipo: "ganada" as const },
];

function prospecto(parcial: Partial<ProspectoAlerta> & Pick<ProspectoAlerta, "id">): ProspectoAlerta {
  return {
    nombre: "Ana",
    etapaId: "abierta",
    proximoContacto: null,
    horaContacto: null,
    actualizadoEn: "2026-10-08T12:00:00.000Z",
    cerradoEn: null,
    ufCierre: null,
    ...parcial,
  };
}

describe("alertasProgramadas", () => {
  const cita = instanteEnChile("2026-10-08", "10:00");

  it("avisa 15 minutos antes y a la hora, una sola vez", () => {
    const p = prospecto({ id: "1", proximoContacto: "2026-10-08", horaContacto: "10:00" });
    const antes = alertasProgramadas({
      ahora: new Date(cita.getTime() - 15 * 60_000),
      prospectos: [p],
      etapas,
      metaUfMes: null,
      dedups: new Set(),
    });
    expect(antes.map((a) => a.tipo)).toEqual(["agenda_antes"]);

    const ahora = alertasProgramadas({
      ahora: cita,
      prospectos: [p],
      etapas,
      metaUfMes: null,
      dedups: new Set(antes.map((a) => a.dedup)),
    });
    expect(ahora.map((a) => a.tipo)).toEqual(["agenda_ahora"]);
  });

  it("sin hora avisa una vez el día del contacto", () => {
    const avisos = alertasProgramadas({
      ahora: instanteEnChile("2026-10-08", "08:00"),
      prospectos: [prospecto({ id: "1", proximoContacto: "2026-10-08" })],
      etapas,
      metaUfMes: null,
      dedups: new Set(),
    });
    expect(avisos.map((a) => a.tipo)).toEqual(["agenda_dia"]);
  });

  it("marca estancado solo a etapas abiertas con más de 5 días quietos", () => {
    const ahora = instanteEnChile("2026-10-08", "12:00");
    const viejo = new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const reciente = new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const avisos = alertasProgramadas({
      ahora,
      prospectos: [
        prospecto({ id: "quieto", actualizadoEn: viejo }),
        prospecto({ id: "reciente", actualizadoEn: reciente }),
        prospecto({ id: "cerrado", etapaId: "ganada", actualizadoEn: viejo }),
      ],
      etapas,
      metaUfMes: null,
      dedups: new Set(),
    });
    expect(avisos.map((a) => a.prospectoId)).toEqual(["quieto"]);
  });

  it("avisa 50, 80 y 100 de la meta de UF sin repetir umbrales", () => {
    const ahora = instanteEnChile("2026-10-08", "12:00");
    const cerrado = prospecto({
      id: "c",
      etapaId: "ganada",
      cerradoEn: "2026-10-02",
      ufCierre: 8,
    });
    const avisos = alertasProgramadas({
      ahora,
      prospectos: [cerrado],
      etapas,
      metaUfMes: 10,
      dedups: new Set(["meta:2026-10:50"]),
    });
    expect(avisos.map((a) => a.dedup)).toEqual(["meta:2026-10:80"]);
  });
});
