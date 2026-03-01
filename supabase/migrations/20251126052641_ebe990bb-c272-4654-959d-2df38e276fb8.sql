-- Insert test zones with proper geometry (Bangalore areas)
-- Zone A: Koramangala area
INSERT INTO zones (
  name,
  ward_number,
  geometry,
  flood_risk_score,
  heat_risk_score,
  population,
  area_sqkm,
  metadata
) VALUES (
  'Koramangala Zone',
  'Ward-154',
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6050,12.9300],[77.6150,12.9300],[77.6150,12.9200],[77.6050,12.9200],[77.6050,12.9300]]]}'),
  0.65,
  0.55,
  45000,
  2.5,
  jsonb_build_object(
    'centroid', jsonb_build_object('lat', 12.9250, 'lng', 77.6100),
    'description', 'High-density residential and commercial area with aging drainage infrastructure',
    'drainage_assets', jsonb_build_array(
      jsonb_build_object('type', 'main_pipe', 'diameter_mm', 600, 'material', 'RCC', 'age_years', 25),
      jsonb_build_object('type', 'branch_pipe', 'diameter_mm', 300, 'material', 'PVC', 'age_years', 15)
    ),
    'last_inspection', '2024-06-15'
  )
)
ON CONFLICT DO NOTHING;

-- Zone B: Indiranagar area
INSERT INTO zones (
  name,
  ward_number,
  geometry,
  flood_risk_score,
  heat_risk_score,
  population,
  area_sqkm,
  metadata
) VALUES (
  'Indiranagar Zone',
  'Ward-86',
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6350,12.9750],[77.6450,12.9750],[77.6450,12.9650],[77.6350,12.9650],[77.6350,12.9750]]]}'),
  0.75,
  0.60,
  52000,
  3.2,
  jsonb_build_object(
    'centroid', jsonb_build_object('lat', 12.9700, 'lng', 77.6400),
    'description', 'Commercial hub with frequent waterlogging during monsoon',
    'drainage_assets', jsonb_build_array(
      jsonb_build_object('type', 'main_pipe', 'diameter_mm', 750, 'material', 'RCC', 'age_years', 30),
      jsonb_build_object('type', 'storm_drain', 'diameter_mm', 450, 'material', 'Concrete', 'age_years', 20)
    ),
    'last_inspection', '2024-08-20'
  )
)
ON CONFLICT DO NOTHING;