import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Design, Order, User } from '../App';
import { User as UserIcon, Package, Palette, ShoppingCart, Calendar, Edit2, Save, X } from 'lucide-react';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Language, t, getPhoneModelDisplayName } from '../utils/translations';

interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  designs: Design[];
  orders: Order[];
  language: Language;
}

export function UserProfile({ user, onUpdateUser, designs, orders, language }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = () => {
    onUpdateUser(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const recentOrders = orders.slice(-3).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t(language, 'userProfile')}</h2>
        <p className="text-muted-foreground">{t(language, 'manageAccount')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                {t(language, 'profileInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="name">{t(language, 'fullName')}</Label>
                    <Input
                      id="name"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t(language, 'email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} size="sm" className="flex-1 flex items-center gap-1">
                      <Save className="w-3 h-3" />
                      {t(language, 'save')}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {t(language, 'cancel')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserIcon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.isAdmin && (
                      <Badge variant="destructive" className="mt-2">
                        {t(language, 'administrator')}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {t(language, 'editProfile')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t(language, 'accountStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{t(language, 'designsCreated')}</span>
                </div>
                <Badge variant="secondary">{designs.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{t(language, 'ordersPlaced')}</span>
                </div>
                <Badge variant="secondary">{orders.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{t(language, 'totalSpent')}</span>
                </div>
                <Badge variant="secondary">${totalSpent.toFixed(2)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Designs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t(language, 'recentDesigns')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t(language, 'noDesignsCreated')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {designs.slice(-4).reverse().map((design) => (
                    <div key={design.id} className="flex gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0">
                        <PhoneCaseMockup
                          phoneModel={design.phoneModel}
                          designImage={design.imageDataUrl}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{design.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {getPhoneModelDisplayName(language, design.phoneModel)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(design.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t(language, 'recentOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t(language, 'noOrdersPlaced')}</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0">
                        <PhoneCaseMockup
                          phoneModel={order.design.phoneModel}
                          designImage={order.design.imageDataUrl}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{order.design.name}</h4>
                            <p className="text-xs text-muted-foreground">{t(language, 'orderNumber')} #{order.id}</p>
                          </div>
                          <Badge 
                            variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'shipped' ? 'secondary' :
                              order.status === 'processing' ? 'outline' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {t(language, order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>${order.totalPrice.toFixed(2)}</span>
                          <span>{t(language, 'qty')}: {order.quantity}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}