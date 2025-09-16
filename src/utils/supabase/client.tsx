import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

import { Design, DesignData } from '../../types/design';
import { Order, OrderData } from '../../types/order';

// Create Supabase client
const supabaseUrl = `https://${projectId}.supabase.co`;
export const supabase = createClient(supabaseUrl, publicAnonKey);

// Design functions
export const createDesign = async (design: Omit<Design, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('designs')
    .insert(design)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getDesigns = async (userId: string) => {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getDesign = async (id: string) => {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Order functions
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      designs (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};