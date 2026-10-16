-- Precios de referencia. Trimestral ≈ −10% y anual −20%, redondeados al 990 más cercano.
-- Básico 14990 → 39990 / 143990. Profesional 29990 → 80990 / 287990. Full 39990 → 107990 / 383990.

update public.planes
set precio_mensual_clp = 14990, precio_trimestral_clp = 39990, precio_anual_clp = 143990
where nivel = 'basico';

update public.planes
set precio_mensual_clp = 29990, precio_trimestral_clp = 80990, precio_anual_clp = 287990
where nivel = 'intermedio';

update public.planes
set precio_mensual_clp = 39990, precio_trimestral_clp = 107990, precio_anual_clp = 383990
where nivel = 'full';
