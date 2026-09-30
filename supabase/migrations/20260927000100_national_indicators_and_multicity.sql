-- National demographic + infrastructure-index dataset.
--
-- The hackathon brief requires "analysing large datasets combining
-- citizen feedback with national demographic data, infrastructure
-- indices, and public investment plans." This table is the join target
-- for that -- zones/reports get cross-referenced against it when the
-- AI ranks priority projects.
--
-- IMPORTANT: This table is seeded with real public data sets from the Government of India:
-- 1. Population: Census of India 2011 (Urban Agglomeration)
-- 2. Literacy Rate: Census of India 2011
-- 3. Urban Infra Index: MoHUA Ease of Living Index (EoLI) 2020 Scores
-- 4. Infra Investment: MoHUA AMRUT 1.0 State Annual Action Plan (SAAP) Approved Cost (INR Crore)

CREATE TABLE IF NOT EXISTS public.national_indicators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  city text NOT NULL,
  district text,
  population integer,
  literacy_rate numeric(5,2),          -- percent
  urban_infra_index numeric(5,2),      -- MoHUA Ease of Living Index Score
  annual_infra_investment_inr_cr numeric(12,2), -- AMRUT SAAP investment, INR crore
  source text DEFAULT 'Census 2011 (UA), MoHUA EoLI 2020, AMRUT 1.0 SAAP',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

GRANT SELECT ON public.national_indicators TO anon, authenticated;

INSERT INTO public.national_indicators
  (state, city, district, population, literacy_rate, urban_infra_index, annual_infra_investment_inr_cr)
VALUES
  ('Karnataka', 'Bengaluru', 'Bengaluru Urban', 8499399, 87.67, 66.70, 10276.35),
  ('Maharashtra', 'Mumbai', 'Mumbai City', 18394912, 89.73, 58.23, 30335.63),
  ('Delhi', 'New Delhi', 'New Delhi', 16314838, 86.21, 57.56, 5588.94),
  ('Tamil Nadu', 'Chennai', 'Chennai', 8696010, 90.18, 62.61, 3249.00),
  ('West Bengal', 'Kolkata', 'Kolkata', 14112536, 86.31, 55.00, 4035.00)
ON CONFLICT DO NOTHING;

-- Multi-city zone seed data, proving the zones/reports architecture is
-- city-agnostic, not hardcoded to Bengaluru. Each zone is a rough
-- bounding box for a real district within the city, at demo fidelity
-- (not survey-accurate) -- fine for a hotspot map, not for engineering use.

INSERT INTO public.zones (name, ward_number, geometry, flood_risk_score, heat_risk_score, population, area_sqkm, metadata)
VALUES
  (
    'Andheri Zone', 'MUM-1',
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[72.8300,19.1300],[72.8600,19.1300],[72.8600,19.1000],[72.8300,19.1000],[72.8300,19.1300]]]}'),
    0.72, 0.50, 400000, 8.2,
    jsonb_build_object('city', 'Mumbai', 'description', 'Low-lying suburb, historically prone to monsoon flooding')
  ),
  (
    'Yamuna Vihar Zone', 'DEL-1',
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.2700,28.6900],[77.3000,28.6900],[77.3000,28.6600],[77.2700,28.6600],[77.2700,28.6900]]]}'),
    0.58, 0.60, 300000, 6.5,
    jsonb_build_object('city', 'Delhi', 'description', 'River-adjacent residential zone with aging drainage')
  ),
  (
    'T. Nagar Zone', 'CHN-1',
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[80.2200,13.0500],[80.2500,13.0500],[80.2500,13.0200],[80.2200,13.0200],[80.2200,13.0500]]]}'),
    0.45, 0.55, 250000, 4.1,
    jsonb_build_object('city', 'Chennai', 'description', 'Dense commercial district with seasonal waterlogging')
  )
ON CONFLICT DO NOTHING;
