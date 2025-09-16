import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Building, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Calendar,
  Filter,
  Eye,
  Download
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Language, t } from '../utils/translations';
import { getOrders, updateOrderStatus } from '../utils/supabase/client';
import { AppDesign, convertSupabaseDesign } from '../utils/design-converter';
import { User } from '../App';
import { Order } from '../types/order';

interface CompanyDashboardProps {
  currentUser: User;
  language: Language;
}

const getStatusConfig = (language: Language) => ({
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t(language, 'pending') },
  processing: { icon: Package, color: 'bg-blue-100 text-blue-800', label: t(language, 'processing') },
  shipped: { icon: Truck, color: 'bg-purple-100 text-purple-800', label: t(language, 'shipped') },
  delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t(language, 'delivered') }
});

export function CompanyDashboard({ currentUser, language }: CompanyDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date-new' | 'date-old' | 'price-high' | 'price-low'>('date-new');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<AppDesign | null>(null);
  const [selectedTab, setSelectedTab] = useState<'orders' | 'analytics'>('orders');

  useEffect(() => {
    const fetchOrders = async () => {
      if (currentUser) {
        try {
          const fetchedOrders = await getOrders(currentUser.id);
          setOrders(fetchedOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      }
    };
    fetchOrders();
  }, [currentUser]);

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      const updatedOrders = await getOrders(currentUser.id);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const getOrderDetails = (order: Order) => {
    const shippingAddress = order.shipping_address;
    return {
      customerName: shippingAddress.name || shippingAddress.street.split('\n')[0] || 'N/A',
      customerEmail: order.customer_email || 'N/A',
      address: [
        shippingAddress.street,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.zip,
        shippingAddress.country
      ].filter(Boolean).join(', '),
      totalAmount: order.total_amount || 0,
      date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'
    };
  }

  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortBy) {
      case 'date-new':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'date-old':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case 'price-high':
        return (b.total_amount || 0) - (a.total_amount || 0);
      case 'price-low':
        return (a.total_amount || 0) - (b.total_amount || 0);
      default:
        return 0;
    }
  }).filter((order) => filterStatus === 'all' || order.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t(language, 'totalRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t(language, 'allOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t(language, 'pendingOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t(language, 'total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as Order['status'] | 'all')}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t(language, 'allOrders')}</SelectItem>
            <SelectItem value="pending">{t(language, 'pending')}</SelectItem>
            <SelectItem value="processing">{t(language, 'processing')}</SelectItem>
            <SelectItem value="shipped">{t(language, 'shipped')}</SelectItem>
            <SelectItem value="delivered">{t(language, 'delivered')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
          <SelectTrigger className="w-[200px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-new">{t(language, 'recentDesigns')}</SelectItem>
            <SelectItem value="date-old">{t(language, 'orderDate')}</SelectItem>
            <SelectItem value="price-high">{t(language, 'subtotal')}</SelectItem>
            <SelectItem value="price-low">{t(language, 'total')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {sortedOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 relative">
                    <ImageWithFallback
                      src={order.design?.image_url}
                      alt="Design preview"
                      className="rounded-lg object-cover"
                      fill
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{getOrderDetails(order).customerName}</h3>
                    <p className="text-sm text-muted-foreground">{getOrderDetails(order).customerEmail}</p>
                    <p className="text-sm text-muted-foreground mt-1">{getOrderDetails(order).date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={getStatusConfig(language)[order.status].color}>
                    {getStatusConfig(language)[order.status].label}
                  </Badge>
                  <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t(language, 'orderPreview')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {selectedOrder && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">{t(language, 'designDetails')}</h3>
                    <div className="aspect-square relative">
                      {selectedOrder.design && (
                        <PhoneCaseMockup 
                          phoneModel={selectedOrder.design.phone_model} 
                          designImage={selectedOrder.design.image_url}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t(language, 'customerDetails')}</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">{t(language, 'name')}:</span> {getOrderDetails(selectedOrder).customerName}</p>
                      <p><span className="font-medium">Email:</span> {getOrderDetails(selectedOrder).customerEmail}</p>
                      <p><span className="font-medium">{t(language, 'shippingAddress')}:</span> {getOrderDetails(selectedOrder).address}</p>
                      <p><span className="font-medium">{t(language, 'total')}:</span> ${getOrderDetails(selectedOrder).totalAmount}</p>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">{t(language, 'status')}</h3>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => handleUpdateOrderStatus(selectedOrder.id, value as Order['status'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t(language, 'pending')}</SelectItem>
                          <SelectItem value="processing">{t(language, 'processing')}</SelectItem>
                          <SelectItem value="shipped">{t(language, 'shipped')}</SelectItem>
                          <SelectItem value="delivered">{t(language, 'delivered')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}