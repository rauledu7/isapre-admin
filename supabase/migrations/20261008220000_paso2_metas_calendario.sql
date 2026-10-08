-- Paso 2: metas mensuales del asesor y seguimiento por prospecto.
-- La UF cerrada la ingresa el asesor (precio del plan afiliado).
-- cerrado_en se fija al pasar a una etapa ganada y se limpia al salir.

alter table public.perfiles_asesor
  add column meta_uf_mes numeric(8, 4) check (meta_uf_mes >= 0),
  add column meta_contratos_mes integer check (meta_contratos_mes >= 0);

alter table public.prospectos
  add column proximo_contacto date,
  add column cerrado_en date,
  add column uf_cierre numeric(8, 4) check (uf_cierre >= 0);

create index prospectos_proximo_contacto_idx
  on public.prospectos (asesor_id, proximo_contacto)
  where proximo_contacto is not null;

-- Quienes ya están en una etapa ganada cuentan en el mes de su última actualización.
update public.prospectos p
set cerrado_en = (p.updated_at at time zone 'America/Santiago')::date
from public.etapas_embudo e
where p.etapa_id = e.id
  and e.tipo = 'ganada'
  and p.cerrado_en is null;
