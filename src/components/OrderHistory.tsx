import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Order } from '../App';
import { Package, Calendar, DollarSign, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Language, t } from '../utils/translations';

interface OrderHistoryProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, status: Order['status']) => void;
  language: Language;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pending'
  },
  processing: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    label: 'Processing'
  },
  shipped: {
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    label: 'Shipped'
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    label: 'Delivered'
  }
};

export function OrderHistory({ orders, onUpdateOrder, language }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
            <p>Your order history will appear here once you place your first order.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Order History</h2>
        <p className="text-muted-foreground">Track your phone case orders</p>
      </div>

      <div className="space-y-4">
        {sortedOrders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status];
          const StatusIcon = statusConfig.icon;
          
          return (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Design Preview */}
                  <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                    <PhoneCaseMockup
                      phoneModel={order.design.phoneModel}
                      designImage={order.design.imageDataUrl}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{order.design.name}</h3>
                        <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                      </div>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {order.phoneModel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} × {order.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>${order.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Ship to:</strong> {order.customerInfo.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerInfo.address}
                      </p>
                    </div>

                    {/* Order Timeline */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) 
                            ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={order.status === 'pending' ? 'font-medium' : 'text-muted-foreground'}>
                          Order Placed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          ['processing', 'shipped', 'delivered'].includes(order.status) 
                            ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={order.status === 'processing' ? 'font-medium' : 'text-muted-foreground'}>
                          Processing
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          ['shipped', 'delivered'].includes(order.status) 
                            ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={order.status === 'shipped' ? 'font-medium' : 'text-muted-foreground'}>
                          Shipped
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={order.status === 'delivered' ? 'font-medium' : 'text-muted-foreground'}>
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}