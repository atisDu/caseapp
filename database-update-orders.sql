-- Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS phone_model TEXT,
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS shipping_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4);

-- Update existing orders with 'delivered' status to 'completed'
UPDATE orders SET status = 'completed' WHERE status = 'delivered';

-- Update the status constraint to match the interface
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'shipped', 'completed'));

-- Drop existing policies and create new ones that allow admin access
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Create new policies that allow admin users (admin@case.com) to see all orders
CREATE POLICY "Users and admins can view orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.email() = 'admin@case.com'
  );

CREATE POLICY "Users and admins can insert orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.email() = 'admin@case.com'
  );

CREATE POLICY "Users and admins can update orders" ON orders
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.email() = 'admin@case.com'
  );