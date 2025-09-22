-- Payment System Database Schema
-- This script sets up the tables for the payment system

-- User balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  balance_euros DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance_euros >= 0)
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL UNIQUE,
  user_email VARCHAR(255) NOT NULL,
  amount_euros DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  transaction_type VARCHAR(20) DEFAULT 'topup' NOT NULL, -- 'topup', 'manual_add', 'manual_deduct'
  created_by_admin VARCHAR(255), -- email of admin who created manual transactions
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255), -- email of admin who approved
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'declined')),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('topup', 'manual_add', 'manual_deduct')),
  CONSTRAINT positive_amount CHECK (amount_euros > 0)
);

-- Payment settings table (for admin to configure IBAN and recipient info)
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  iban_number VARCHAR(34) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_address TEXT,
  bank_name VARCHAR(255),
  swift_code VARCHAR(11),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment settings
INSERT INTO payment_settings (iban_number, recipient_name, bank_name)
VALUES (
  'LV80BANK0000435195001', 
  'SIA Example Company', 
  'Swedbank AS'
) ON CONFLICT DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_balances_email ON user_balances(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_email ON payment_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Function to update balance when transaction is approved
CREATE OR REPLACE FUNCTION update_user_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Insert or update user balance
    INSERT INTO user_balances (user_email, balance_euros)
    VALUES (NEW.user_email, NEW.amount_euros)
    ON CONFLICT (user_email) 
    DO UPDATE SET 
      balance_euros = user_balances.balance_euros + 
        CASE 
          WHEN NEW.transaction_type = 'manual_deduct' THEN -NEW.amount_euros
          ELSE NEW.amount_euros
        END,
      updated_at = NOW();
    
    -- Update the approval timestamp and admin
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update balance when transaction is approved
DROP TRIGGER IF EXISTS trigger_update_balance_on_approval ON payment_transactions;
CREATE TRIGGER trigger_update_balance_on_approval
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_on_approval();

-- Function to generate unique transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_id := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if ID already exists
    IF NOT EXISTS (SELECT 1 FROM payment_transactions WHERE transaction_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 100 THEN
      new_id := new_id || EXTRACT(EPOCH FROM NOW())::TEXT;
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;