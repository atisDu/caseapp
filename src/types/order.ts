export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  name?: string;
}

export interface OrderData {
  id?: string;
  user_id: string;
  design_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: ShippingAddress;
  quantity: number;
  total_amount: number;
  customer_email?: string;
  created_at?: string;
  updated_at?: string;
}

import { Design } from './design';

export interface Order extends OrderData {
  id: string;
  design?: Design;
}