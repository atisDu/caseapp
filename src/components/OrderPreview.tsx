import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { User } from '../App';
import { ShoppingCart, CreditCard, Truck, Package } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Language, t } from '../utils/translations';
import { AppDesign } from '../utils/design-converter';
import { createOrder } from '../utils/supabase/client';
import { Order, ShippingAddress } from '../types/order';

export const PHONE_MODELS = [
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', price: 29.99 },
  { id: 'iphone-15', name: 'iPhone 15', price: 27.99 },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', price: 29.99 },
  { id: 'iphone-14', name: 'iPhone 14', price: 27.99 },
  { id: 'samsung-s24', name: 'Samsung Galaxy S24', price: 28.99 },
  { id: 'samsung-s23', name: 'Samsung Galaxy S23', price: 26.99 },
  { id: 'pixel-8-pro', name: 'Google Pixel 8 Pro', price: 28.99 },
  { id: 'pixel-8', name: 'Google Pixel 8', price: 26.99 },
] as const;

interface OrderPreviewProps {
  design: AppDesign;
  onCreateOrder: (orderId: string) => void;
  onClose: () => void;
  currentUser: User;
  language: Language;
}

export function OrderPreview({ design, onCreateOrder, onClose, currentUser, language }: OrderPreviewProps) {
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: currentUser.name,
    email: currentUser.email,
    address: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const phoneModel = PHONE_MODELS.find(m => m.id === design.phoneModel);
  const unitPrice = phoneModel?.price || 0;
  const subtotal = unitPrice * quantity;
  const shipping = subtotal > 50 ? 0 : 4.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, Math.min(100, quantity + change));
    setQuantity(newQuantity);
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const phoneModel = PHONE_MODELS.find(m => m.id === design.phoneModel);
    if (!phoneModel) {
      setIsProcessing(false);
      return;
    }

    try {
      const subtotal = phoneModel.price * quantity;
      const shipping = subtotal > 50 ? 0 : 4.99;
      const tax = subtotal * 0.08;
      const total = subtotal + shipping + tax;

      const [street = '', city = '', state = '', zip = ''] = customerInfo.address.split(',').map(s => s.trim());

      const shippingAddress: ShippingAddress = {
        street,
        city,
        state,
        zip,
        country: 'US',
        name: customerInfo.name
      };

      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        user_id: currentUser.id,
        design_id: design.id,
        total_amount: total,
        status: 'pending',
        shipping_address: shippingAddress,
        quantity: quantity,
        customer_email: customerInfo.email
      };

      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const savedOrder = await createOrder(orderData);
      if (savedOrder && savedOrder.id) {
        onCreateOrder(savedOrder.id);
        onClose();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('There was an error creating your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Design Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t(language, 'orderPreview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-40 sm:h-40 bg-muted rounded-lg overflow-hidden shrink-0">
              <PhoneCaseMockup
                phoneModel={design.phoneModel}
                designImage={design.imageDataUrl}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">{design.name}</h3>
              <Badge variant="secondary">
                {phoneModel?.name}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {t(language, 'customPhoneCase')}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2">
                <span className="font-medium">${unitPrice.toFixed(2)} {t(language, 'each')}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 100}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t(language, 'customerInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t(language, 'fullName')} *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t(language, 'enterFullName')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t(language, 'email')} *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t(language, 'enterEmail')}
              />
            </div>
          </div>
          <div>
            <AddressAutocomplete
              id="address"
              label={`${t(language, 'shippingAddress')} *`}
              value={customerInfo.address}
              onChange={(address) => setCustomerInfo(prev => ({ ...prev, address }))}
              placeholder={t(language, 'startTypingAddress')}
              language={language}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t(language, 'orderPreview')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{t(language, 'subtotal')} ({quantity} {quantity > 1 ? (language === 'lv' ? 'gabali' : 'items') : (language === 'lv' ? 'gabals' : 'item')})</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              {t(language, 'shipping')}
            </span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t(language, 'tax')}</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>{t(language, 'total')}</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          {shipping === 0 && (
            <Badge className="w-full justify-center bg-green-100 text-green-800 hover:bg-green-100">
              Free Shipping on orders over $50!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Mock Stripe Payment */}
      <Card>
        <CardHeader>
          <CardTitle>{t(language, 'mockPayment')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {language === 'lv' ? 
                'Šī ir demonstrācijas vide. Ražošanā tas integrētos ar Stripe drošai maksājumu apstrādei.' :
                'This is a demo environment. In production, this would integrate with Stripe for secure payment processing.'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t(language, 'cardNumber')}</Label>
              <Input placeholder="4242 4242 4242 4242" disabled />
            </div>
            <div>
              <Label>{t(language, 'expiry')}</Label>
              <Input placeholder="12/28" disabled />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t(language, 'cvc')}</Label>
              <Input placeholder="123" disabled />
            </div>
            <div>
              <Label>{t(language, 'zipCode')}</Label>
              <Input placeholder="12345" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 order-2 sm:order-1"
        >
          {t(language, 'cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.address}
          className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              {t(language, 'processing')}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {t(language, 'placeOrder')} ${total.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}