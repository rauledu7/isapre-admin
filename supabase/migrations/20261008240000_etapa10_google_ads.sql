-- Etapa 10: origen del lead (Google Ads / landing) y marca de conversión offline enviada.

alter table public.prospectos
  add column gclid text,
  add column utm_source text,
  add column utm_campaign text,
  add column utm_kw text,
  add column ads_conversion_en timestamptz,
  add column ads_conversion_error text;

alter table public.prospectos
  add constraint prospectos_gclid_len check (gclid is null or char_length(gclid) between 1 and 255),
  add constraint prospectos_utm_source_len check (utm_source is null or char_length(utm_source) between 1 and 120),
  add constraint prospectos_utm_campaign_len check (utm_campaign is null or char_length(utm_campaign) between 1 and 120),
  add constraint prospectos_utm_kw_len check (utm_kw is null or char_length(utm_kw) between 1 and 120);
