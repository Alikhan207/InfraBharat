-- Fix: zones.geometry is a native PostGIS geometry(Polygon,4326) column.
-- Supabase's PostgREST layer returns PostGIS geometry as raw WKB hex
-- strings on a plain `select("*")`, not GeoJSON -- which is what
-- react-leaflet's <GeoJSON data={...}> requires. This silently broke
-- the zones layer on the map.
--
-- Fix: expose a view that converts geometry to GeoJSON explicitly with
-- ST_AsGeoJSON, and query that view from the frontend instead of the
-- raw table. security_invoker keeps the view subject to the same RLS
-- policies as the underlying zones table (Postgres 15+ / Supabase default).

CREATE OR REPLACE VIEW public.zones_geojson
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  ward_number,
  ST_AsGeoJSON(geometry)::json AS geometry,
  flood_risk_score,
  heat_risk_score,
  traffic_score,
  population,
  area_sqkm,
  metadata,
  created_at,
  updated_at
FROM public.zones;

GRANT SELECT ON public.zones_geojson TO anon, authenticated;
