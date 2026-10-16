-- El Básico se queda en la reunión. Prospectos, comparador y notificaciones parten en Profesional.
-- Embudo, PDF, documentos, tarifarios, etapas, importación, Google Ads y leads web quedan en Full.

create or replace function public.plan_permite(p_funcion text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when s.bloqueado_en is not null then false
      when s.estado = 'trialing' or s.fecha_fin_trial > now() or p.nivel is null then true
      when p.nivel = 'full' then true
      when p.nivel = 'intermedio' then p_funcion in (
        'notificaciones',
        'pipeline',
        'comparador',
        'propuesta',
        'prospectos',
        'isapres'
      )
      else false
    end
    from public.suscripciones s
    left join public.planes p on p.id = s.plan_id
    where s.perfil_id = (select auth.uid())
  ), true);
$$;

create table public.agendas (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  hora time not null,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  nota text check (nota is null or char_length(nota) <= 500),
  creado_en timestamptz not null default now()
);

revoke all on public.agendas from anon;
grant select, insert, update, delete on public.agendas to authenticated;

alter table public.agendas enable row level security;

create policy "agendas: solo el asesor dueño"
on public.agendas for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));
