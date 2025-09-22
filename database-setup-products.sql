-- Create phone_models table
CREATE TABLE IF NOT EXISTS phone_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default phone models
INSERT INTO phone_models (id, name, price, is_active) VALUES
('iphone-15-pro', 'iPhone 15 Pro', 29.99, true),
('iphone-15', 'iPhone 15', 27.99, true),
('iphone-14-pro', 'iPhone 14 Pro', 29.99, true),
('iphone-14', 'iPhone 14', 27.99, true),
('samsung-s24', 'Samsung Galaxy S24', 28.99, true),
('samsung-s23', 'Samsung Galaxy S23', 26.99, true),
('pixel-8-pro', 'Google Pixel 8 Pro', 28.99, true),
('pixel-8', 'Google Pixel 8', 26.99, true)
ON CONFLICT (id) DO NOTHING;

-- Insert default materials
INSERT INTO materials (id, name, description, is_active) VALUES
('tpu-gel', 'TPU/Gel', 'Flexible thermoplastic polyurethane with gel coating', true),
('hard-plastic', 'Hard Plastic', 'Durable polycarbonate material', true),
('silicone', 'Silicone', 'Soft silicone material for extra grip', true)
ON CONFLICT (id) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_models_active ON phone_models(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);