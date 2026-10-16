-- Tres planes con precios de referencia (trimestral -10%, anual -20%) y acceso por nivel.
-- plan_permite debe coincidir con FUNCIONES_POR_NIVEL en src/lib/suscripcion.ts.

alter table public.planes
  add column nivel text unique check (nivel in ('basico', 'intermedio', 'full'));

insert into public.planes (nombre, nivel, precio_mensual_clp, precio_trimestral_clp, precio_anual_clp) values
  ('Básico', 'basico', 9990, 26990, 95990),
  ('Profesional', 'intermedio', 19990, 53990, 191990),
  ('Full', 'full', 29990, 80990, 287990);

create function public.plan_permite(p_funcion text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when s.estado = 'trialing' or p.nivel is null then true
      when p.nivel = 'full' then true
      when p.nivel = 'intermedio' then p_funcion in ('plan_pdf', 'leads_web', 'documentos')
      else false
    end
    from public.suscripciones s
    left join public.planes p on p.id = s.plan_id
    where s.perfil_id = (select auth.uid())
  ), true);
$$;

revoke execute on function public.plan_permite(text) from public, anon;
grant execute on function public.plan_permite(text) to authenticated;

create policy "documentos: según plan"
on public.documentos as restrictive for all to authenticated
using (public.plan_permite('documentos'))
with check (public.plan_permite('documentos'));

create policy "prospecto-documentos: según plan"
on storage.objects as restrictive for all to authenticated
using (bucket_id <> 'prospecto-documentos' or public.plan_permite('documentos'))
with check (bucket_id <> 'prospecto-documentos' or public.plan_permite('documentos'));

create policy "tarifarios: según plan"
on public.tarifarios as restrictive for all to authenticated
using (public.plan_permite('tarifarios'))
with check (public.plan_permite('tarifarios'));

create policy "google_ads_cuentas: según plan"
on public.google_ads_cuentas as restrictive for all to authenticated
using (public.plan_permite('google_ads'))
with check (public.plan_permite('google_ads'));
