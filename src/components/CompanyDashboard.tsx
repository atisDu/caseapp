import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Order, Design } from '../App';
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
import { AdminProductManager } from './AdminProductManager';
import { Language, t, getPhoneModelDisplayName } from '../utils/translations';

interface CompanyDashboardProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  designs: Design[];
  language: Language;
}

const getStatusConfig = (language: Language) => ({
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t(language, 'pending') },
  processing: { icon: Package, color: 'bg-blue-100 text-blue-800', label: t(language, 'processing') },
  shipped: { icon: Truck, color: 'bg-purple-100 text-purple-800', label: t(language, 'shipped') },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t(language, 'completed') }
});

export function CompanyDashboard({ orders, onUpdateOrderStatus, designs, language }: CompanyDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  const statusConfig = getStatusConfig(language);

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  // Filter and sort orders
  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.totalPrice - a.totalPrice;
      case 'lowest':
        return a.totalPrice - b.totalPrice;
      default:
        return 0;
    }
  });

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    onUpdateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building className="w-6 h-6" />
        <div>
          <h2 className="text-2xl font-bold">{t(language, 'companyDashboard')}</h2>
          <p className="text-muted-foreground">
            {language === 'lv' ? 'Pārvaldiet pasūtījumus un sekojiet uzņēmējdarbības rādītājiem' : 'Manage orders and track business metrics'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            {language === 'lv' ? 'Pārskats' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="orders">
            {language === 'lv' ? 'Pasūtījumu pārvaldība' : 'Order Management'}
          </TabsTrigger>
          <TabsTrigger value="products">
            {language === 'lv' ? 'Produktu pārvaldība' : 'Product Management'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {language === 'lv' ? 'Sīkāki dati' : 'Analytics'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t(language, 'totalRevenue')}</p>
                    <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <p className="text-2xl font-bold">{pendingOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Designs Created</p>
                    <p className="text-2xl font-bold">{designs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t(language, 'orderStatusOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                  <p className="text-sm text-muted-foreground">{t(language, 'pending')}</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{processingOrders}</p>
                  <p className="text-sm text-muted-foreground">{t(language, 'processing')}</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Truck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{shippedOrders}</p>
                  <p className="text-sm text-muted-foreground">{t(language, 'shipped')}</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{completedOrders}</p>
                  <p className="text-sm text-muted-foreground">{t(language, 'completed')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t(language, 'allStatus')}</SelectItem>
                      <SelectItem value="pending">{t(language, 'pending')}</SelectItem>
                      <SelectItem value="processing">{t(language, 'processing')}</SelectItem>
                      <SelectItem value="shipped">{t(language, 'shipped')}</SelectItem>
                      <SelectItem value="completed">{t(language, 'completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t(language, 'newestFirst')}</SelectItem>
                    <SelectItem value="oldest">{t(language, 'oldestFirst')}</SelectItem>
                    <SelectItem value="highest">{t(language, 'highestValue')}</SelectItem>
                    <SelectItem value="lowest">{t(language, 'lowestValue')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {sortedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">{t(language, 'noOrdersFound')}</h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' ? t(language, 'noOrdersYet') : t(language, 'noFilteredOrders').replace('{status}', statusFilter)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedOrders.map((order) => {
                const currentStatusConfig = statusConfig[order.status];
                const StatusIcon = currentStatusConfig.icon;
                
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
                            <div className="flex items-center gap-2">
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order.id, value as Order['status'])}
                              >
                                <SelectTrigger className="w-32">
                                  <Badge className={currentStatusConfig.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {currentStatusConfig.label}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{t(language, 'pending')}</SelectItem>
                                  <SelectItem value="processing">{t(language, 'processing')}</SelectItem>
                                  <SelectItem value="shipped">{t(language, 'shipped')}</SelectItem>
                                  <SelectItem value="completed">{t(language, 'completed')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">{t(language, 'customer')}</p>
                              <p className="font-medium">{order.customerInfo.name}</p>
                              <p className="text-xs text-muted-foreground">{order.customerInfo.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{t(language, 'product')}</p>
                              <p className="font-medium">
                                {getPhoneModelDisplayName(language, order.phoneModel)}
                              </p>
                              <p className="text-xs text-muted-foreground">{t(language, 'orderQuantity')}: {order.quantity}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{t(language, 'total')}</p>
                              <p className="font-medium text-lg">${order.totalPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{t(language, 'orderDate')}</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">{t(language, 'shippingAddress')}:</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customerInfo.address}
                            </p>
                          </div>

                          {/* Shipping Method */}
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">{t(language, 'shippingMethod')}:</p>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">{order.shippingMethod}</p>
                              <p className="text-sm font-medium">${order.shippingPrice.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Price Breakdown */}
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-2">{t(language, 'priceBreakdown')}:</p>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{t(language, 'unitPrice')} × {order.quantity}</span>
                                <span>${order.unitPrice.toFixed(2)} × {order.quantity}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{t(language, 'subtotal')}</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{t(language, 'shipping')}</span>
                                <span>${order.shippingPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{t(language, 'tax')} ({(order.taxRate * 100).toFixed(1)}%)</span>
                                <span>${order.taxAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-medium border-t pt-1">
                                <span>{t(language, 'total')}</span>
                                <span>${order.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <AdminProductManager language={language} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'lv' ? 'Uzņemuma analīze' : 'Business analytics'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Revenue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t(language, 'pendingOrders')}</span>
                      <span>${orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t(language, 'processing')} Orders</span>
                      <span>${orders.filter(o => o.status === 'processing').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t(language, 'shipped')} Orders</span>
                      <span>${orders.filter(o => o.status === 'shipped').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>{t(language, 'completedOrders')}</span>
                      <span>${orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">{t(language, 'orderMetrics')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t(language, 'averageOrderValue')}</span>
                      <span>${orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t(language, 'totalItemsSold')}</span>
                      <span>{orders.reduce((sum, o) => sum + o.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t(language, 'conversionRate')}</span>
                      <span>{designs.length > 0 ? ((orders.length / designs.length) * 100).toFixed(1) : '0'}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}