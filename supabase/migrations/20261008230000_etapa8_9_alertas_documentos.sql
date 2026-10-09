-- Etapa 8 y 9: alertas del asesor y documentos del prospecto.
-- Bucket privado prospecto-documentos. Cada archivo vive en {asesor_id}/...

alter table public.prospectos
  add column hora_contacto time;

create table public.dispositivos_push (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('agenda_antes', 'agenda_ahora', 'agenda_dia', 'etapa', 'estancado', 'meta')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  cuerpo text not null check (char_length(cuerpo) between 1 and 300),
  prospecto_id uuid references public.prospectos (id) on delete cascade,
  dedup text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now(),
  unique (asesor_id, dedup)
);

create index notificaciones_asesor_idx on public.notificaciones (asesor_id, created_at desc);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prospecto_id uuid not null references public.prospectos (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 180),
  tipo_doc text not null check (tipo_doc in ('liquidacion', 'cedula', 'afp', 'fun', 'cargas', 'otros')),
  file_path text not null,
  mime text not null,
  tamano_bytes bigint not null check (tamano_bytes > 0 and tamano_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index documentos_asesor_idx on public.documentos (asesor_id, created_at desc);
create index documentos_prospecto_idx on public.documentos (prospecto_id);

revoke all on public.dispositivos_push, public.notificaciones, public.documentos from anon;
grant select, insert, update, delete on public.dispositivos_push, public.notificaciones, public.documentos to authenticated;

alter table public.dispositivos_push enable row level security;
alter table public.notificaciones enable row level security;
alter table public.documentos enable row level security;

create policy "dispositivos_push: solo el asesor dueño"
on public.dispositivos_push for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

create policy "notificaciones: solo el asesor dueño"
on public.notificaciones for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

create policy "documentos: solo el asesor dueño"
on public.documentos for all to authenticated
using (asesor_id = (select auth.uid()))
with check (
  asesor_id = (select auth.uid())
  and exists (
    select 1 from public.prospectos p
    where p.id = documentos.prospecto_id and p.asesor_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('prospecto-documentos', 'prospecto-documentos', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "prospecto-documentos: leer"
on storage.objects for select to authenticated
using (
  bucket_id = 'prospecto-documentos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "prospecto-documentos: crear"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'prospecto-documentos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "prospecto-documentos: borrar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'prospecto-documentos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
