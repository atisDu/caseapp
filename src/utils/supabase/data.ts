import { supabase } from './client';

// Payment System Database Functions

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  user_email: string;
  amount_euros: number;
  status: 'pending' | 'approved' | 'declined';
  transaction_type: 'topup' | 'manual_add' | 'manual_deduct';
  created_by_admin?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface PaymentSettings {
  id: string;
  iban_number: string;
  recipient_name: string;
  recipient_address?: string;
  bank_name?: string;
  swift_code?: string;
}

export interface UserBalance {
  user_email: string;
  balance_euros: number;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimated_days?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Generate unique transaction ID
export function generateTransactionId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN${date}${random}`;
}

// Get user balance
export async function getUserBalance(userEmail: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance_euros')
      .eq('user_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data?.balance_euros || 0;
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return 0;
  }
}

// Get payment settings
export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  try {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return null;
  }
}

// Create payment transaction
export async function createPaymentTransaction(
  userEmail: string,
  amount: number,
  transactionId: string,
  transactionType: 'topup' | 'manual_add' | 'manual_deduct' = 'topup',
  createdByAdmin?: string,
  notes?: string
): Promise<PaymentTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: transactionId,
        user_email: userEmail,
        amount_euros: amount,
        transaction_type: transactionType,
        created_by_admin: createdByAdmin,
        notes: notes,
        status: transactionType === 'topup' ? 'pending' : 'approved'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    return null;
  }
}

// Get all payment transactions
export async function getPaymentTransactions(statusFilter?: string): Promise<PaymentTransaction[]> {
  try {
    let query = supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return [];
  }
}

// Update transaction status
export async function updateTransactionStatus(
  transactionId: string,
  status: 'approved' | 'declined',
  approvedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        status: status,
        approved_by: approvedBy,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
}

// Get all user balances
export async function getAllUserBalances(): Promise<UserBalance[]> {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .order('balance_euros', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user balances:', error);
    return [];
  }
}

// Update payment settings
export async function updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<boolean> {
  try {
    // First, get the current settings
    const currentSettings = await getPaymentSettings();
    
    if (currentSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('payment_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSettings.id);

      if (error) {
        throw error;
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('payment_settings')
        .insert(settings);

      if (error) {
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return false;
  }
}

// Get unique user emails from transactions and balances
export async function getUniqueUserEmails(): Promise<string[]> {
  try {
    const [transactionUsers, balanceUsers] = await Promise.all([
      supabase
        .from('payment_transactions')
        .select('user_email')
        .order('user_email'),
      supabase
        .from('user_balances')
        .select('user_email')
        .order('user_email')
    ]);

    const allEmails = new Set([
      ...(transactionUsers.data?.map(t => t.user_email) || []),
      ...(balanceUsers.data?.map(b => b.user_email) || [])
    ]);

    return Array.from(allEmails);
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return [];
  }
}

// Shipping Methods Database Functions

// Get all shipping methods
export async function getShippingMethods(activeOnly: boolean = true): Promise<ShippingMethod[]> {
  try {
    let query = supabase
      .from('shipping_methods')
      .select('*')
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return [];
  }
}

// Create shipping method
export async function createShippingMethod(shippingMethod: Omit<ShippingMethod, 'created_at' | 'updated_at'>): Promise<ShippingMethod | null> {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .insert(shippingMethod)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating shipping method:', error);
    return null;
  }
}

// Update shipping method
export async function updateShippingMethod(id: string, updates: Partial<Omit<ShippingMethod, 'id' | 'created_at'>>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('shipping_methods')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating shipping method:', error);
    return false;
  }
}

// Delete shipping method
export async function deleteShippingMethod(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting shipping method:', error);
    return false;
  }
}