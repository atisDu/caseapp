-- Update payment_transactions table to allow negative amounts for order deductions
-- This removes the positive_amount constraint to allow order payments (negative amounts)

-- Drop the existing positive_amount constraint
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS positive_amount;

-- Add a comment to explain that negative amounts represent order deductions
COMMENT ON COLUMN payment_transactions.amount_euros IS 'Transaction amount in euros. Positive for top-ups, negative for order deductions';

-- Update the constraint to allow negative amounts but not zero
ALTER TABLE payment_transactions ADD CONSTRAINT non_zero_amount CHECK (amount_euros != 0);

-- ALSO FIX USER_BALANCES TABLE: Remove positive balance constraint to allow balance deductions
ALTER TABLE user_balances DROP CONSTRAINT IF EXISTS positive_balance;

-- Update the trigger function to handle negative amounts directly and check for sufficient balance
CREATE OR REPLACE FUNCTION update_user_balance_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2) := 0.00;
  new_balance DECIMAL(10,2);
BEGIN
  -- Only update balance when status changes to 'approved' OR when inserting with 'approved' status
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    
    -- Get current balance
    SELECT balance_euros INTO current_balance 
    FROM user_balances 
    WHERE user_email = NEW.user_email;
    
    -- If user doesn't exist, current_balance remains 0
    IF current_balance IS NULL THEN
      current_balance := 0.00;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + NEW.amount_euros;
    
    -- For deductions (negative amounts), check if user has sufficient balance
    IF NEW.amount_euros < 0 AND new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %, Shortage: %', 
        current_balance, ABS(NEW.amount_euros), ABS(new_balance);
    END IF;
    
    -- Insert or update user balance using the amount directly (negative amounts will subtract)
    INSERT INTO user_balances (user_email, balance_euros)
    VALUES (NEW.user_email, NEW.amount_euros)
    ON CONFLICT (user_email) 
    DO UPDATE SET 
      balance_euros = user_balances.balance_euros + NEW.amount_euros,
      updated_at = NOW();
    
    -- Update the approval timestamp only if it's not already set
    IF NEW.approved_at IS NULL THEN
      NEW.approved_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS trigger_update_balance_on_approval ON payment_transactions;
CREATE TRIGGER trigger_update_balance_on_approval
  BEFORE INSERT OR UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_on_approval();