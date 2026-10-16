-- Etapa 13: el super admin puede bloquear a un asesor. Sigue pudiendo entrar, pero solo ve el aviso.

alter table public.suscripciones
  add column bloqueado_en timestamptz;

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
      when p.nivel = 'intermedio' then p_funcion in ('plan_pdf', 'leads_web', 'documentos')
      else false
    end
    from public.suscripciones s
    left join public.planes p on p.id = s.plan_id
    where s.perfil_id = (select auth.uid())
  ), true);
$$;
