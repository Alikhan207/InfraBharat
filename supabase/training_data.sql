-- Create a table for the AI Training Dataset
CREATE TABLE IF NOT EXISTS public.ai_training_data (
    blueprint_id TEXT PRIMARY KEY,
    pipe_count INTEGER,
    avg_diameter_mm INTEGER,
    slope_percent DECIMAL(4,2),
    manholes INTEGER,
    blockages_reported INTEGER,
    location_lat DECIMAL(10,6),
    location_lng DECIMAL(10,6),
    flow_risk_score DECIMAL(4,2),
    risk_label TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows everyone to read this data (public reference data)
CREATE POLICY "Allow public read access" ON public.ai_training_data
    FOR SELECT USING (true);

-- Insert the dataset
INSERT INTO public.ai_training_data (blueprint_id, pipe_count, avg_diameter_mm, slope_percent, manholes, blockages_reported, location_lat, location_lng, flow_risk_score, risk_label)
VALUES
    ('BP001', 12, 450, 0.8, 4, 2, 12.9412, 77.6102, 0.67, 'Medium'),
    ('BP002', 7, 300, 0.4, 2, 4, 12.9766, 77.5994, 0.82, 'High'),
    ('BP003', 15, 600, 1.2, 6, 0, 12.9501, 77.5809, 0.21, 'Low'),
    ('BP004', 9, 350, 0.5, 3, 3, 12.9650, 77.6050, 0.73, 'High'),
    ('BP005', 11, 500, 0.9, 5, 1, 12.9594, 77.6345, 0.44, 'Medium'),
    ('BP006', 6, 250, 0.3, 1, 5, 12.9312, 77.6223, 0.91, 'High'),
    ('BP007', 14, 550, 1.0, 4, 1, 12.9485, 77.5991, 0.39, 'Medium'),
    ('BP008', 10, 400, 0.7, 3, 2, 12.9701, 77.6188, 0.59, 'Medium'),
    ('BP009', 5, 200, 0.2, 1, 6, 12.9451, 77.5852, 0.95, 'High'),
    ('BP010', 16, 650, 1.3, 7, 0, 12.9812, 77.6200, 0.15, 'Low');
