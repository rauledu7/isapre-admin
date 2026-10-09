-- Página de leads opcional por asesor, y marca de los prospectos que llegan de ese formulario.

alter table public.perfiles_asesor
  add column sitio_web text,
  add constraint perfiles_asesor_sitio_web_url check (
    sitio_web is null or sitio_web ~ '^https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
  );

create unique index perfiles_asesor_sitio_web_idx
  on public.perfiles_asesor (sitio_web)
  where sitio_web is not null;

alter table public.prospectos
  add column origen text,
  add constraint prospectos_origen_check check (origen is null or origen = 'web');
