import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Design, Order, User } from '../App';
import { ShoppingCart, CreditCard, Truck, Package } from 'lucide-react';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Language, t } from '../utils/translations';
import { SHIPPING_OPTIONS } from '../constants/shipping-options';
import { COUNTRIES } from '../constants/countries';
import { supabase } from '../utils/supabase/client';

interface PhoneModel {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface OrderPreviewProps {
  design: Design;
  onCreateOrder: (order: Order) => void;
  onClose: () => void;
  currentUser: User;
  language: Language;
}

export function OrderPreview({ design, onCreateOrder, onClose, currentUser, language }: OrderPreviewProps) {
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'LV',
    phone: '',
  });
  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_OPTIONS[0].id);
  const [bulkInput, setBulkInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPhoneModels();
  }, []);

  const loadPhoneModels = async () => {
    setLoading(true);
    try {
      const { data: phoneData, error } = await supabase
        .from('phone_models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading phone models:', error);
      } else {
        setPhoneModels(phoneData || []);
      }
    } catch (error) {
      console.error('Error loading phone models:', error);
    } finally {
      setLoading(false);
    }
  };

  const phoneModel = phoneModels.find(m => m.id === design.phoneModel);
  const unitPrice = phoneModel?.price || 0;
  const subtotal = unitPrice * quantity;
  const shippingOption = SHIPPING_OPTIONS.find(s => s.id === selectedShipping);
  const shippingCost = shippingOption?.price || 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  const handleBulkInput = (input: string) => {
    const lines = input.split('\n');
    if (lines.length >= 2) {
      // Parse line 2 for city, state, zip if it exists
      let city = '', state = '', zipCode = '';
      if (lines[2]) {
        const parts = lines[2].split(',').map(part => part.trim());
        if (parts.length >= 2) {
          city = parts[0] || '';
          // Parse the second part which contains "State ZIP"
          const stateZipPart = parts[1];
          const stateZipMatch = stateZipPart.match(/^([A-Za-z\s]+)\s+([A-Za-z0-9\-\s]+)$/);
          if (stateZipMatch) {
            state = stateZipMatch[1].trim();
            zipCode = stateZipMatch[2].trim();
          } else {
            // Fallback: try to split by space and take last part as ZIP
            const spaceParts = stateZipPart.split(/\s+/);
            if (spaceParts.length >= 2) {
              zipCode = spaceParts[spaceParts.length - 1];
              state = spaceParts.slice(0, -1).join(' ');
            } else {
              state = stateZipPart;
            }
          }
        } else if (parts.length === 1) {
          city = parts[0] || '';
        }
      }

      // Find country code from country name in line 3
      let countryCode = customerInfo.country; // default
      if (lines[3]) {
        const countryName = lines[3].trim();
        const foundCountry = COUNTRIES.find(c => 
          c.name.toLowerCase() === countryName.toLowerCase() ||
          c.code.toLowerCase() === countryName.toLowerCase()
        );
        if (foundCountry) {
          countryCode = foundCountry.code;
        }
      }

      setCustomerInfo(prev => ({
        ...prev,
        name: lines[0] || prev.name,
        address1: lines[1] || prev.address1,
        address2: '', // Clear address2 since we're not using it in this format
        city: city || prev.city,
        state: state || prev.state,
        zipCode: zipCode || prev.zipCode,
        country: countryCode,
      }));
    }
    setBulkInput(input);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, Math.min(100, quantity + change));
    setQuantity(newQuantity);
  };

  const handleSubmitOrder = async () => {
    const requiredFields = {
      name: 'Full Name',
      address1: 'Address Line 1',
      city: 'City',
      zipCode: 'ZIP Code',
      country: 'Country'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !customerInfo[key as keyof typeof customerInfo])
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n${missingFields.join('\n')}`);
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const shippingAddress = [
        customerInfo.name,
        customerInfo.address1,
        customerInfo.address2,
        customerInfo.city,
        customerInfo.state,
        customerInfo.zipCode,
        COUNTRIES.find(c => c.code === customerInfo.country)?.name,
        customerInfo.phone,
      ].filter(Boolean).join('\n');

      const order: Order = {
        id: Date.now().toString(),
        designId: design.id,
        design: design,
        userId: currentUser.id,
        quantity,
        status: 'pending',
        shippingAddress,
        totalPrice: total,
        unitPrice: unitPrice,
        subtotal: subtotal,
        taxAmount: tax,
        taxRate: 0.08,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          address: shippingAddress
        },
        phoneModel: design.phoneModel,
        shippingMethod: shippingOption?.name || 'Standard',
        shippingPrice: shippingCost,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onCreateOrder(order);
      alert(`Order placed successfully! Order ID: ${order.id}\nYou will receive a confirmation email shortly.`);
      onClose();
    } catch (error) {
      alert('Payment failed. Please try again.');
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
          <div className="aspect-[75/159] max-w-xs mx-auto mb-4">
            <PhoneCaseMockup
              phoneModel={design.phoneModel}
              designImage={design.imageDataUrl}
              className="w-full h-full"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{design.name}</span>
              <span>${unitPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 100}
              >
                +
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {t(language, 'shippingAddress')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Input */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="bulk-input">{t(language, 'quickAddressInput')}</Label>
              <Textarea
                id="bulk-input"
                value={bulkInput}
                onChange={(e) => handleBulkInput(e.target.value)}
                placeholder={t(language, 'pasteFormattedAddress')}
                className="h-32"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t(language, 'addressFormatInstructions')}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t(language, 'fullName')} *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t(language, 'enterFullName')}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address1">{t(language, 'addressLine1')} *</Label>
              <Input
                id="address1"
                value={customerInfo.address1}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address1: e.target.value }))}
                placeholder={t(language, 'streetAddress')}
                required
              />
            </div>

            <div>
              <Label htmlFor="address2">{t(language, 'addressLine2')}</Label>
              <Input
                id="address2"
                value={customerInfo.address2}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address2: e.target.value }))}
                placeholder={t(language, 'apartmentSuite')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">{t(language, 'city')} *</Label>
                <Input
                  id="city"
                  value={customerInfo.city}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t(language, 'city')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">{t(language, 'stateProvince')}</Label>
                <Input
                  id="state"
                  value={customerInfo.state}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                  placeholder={t(language, 'stateProvincePlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">{t(language, 'zipCode')} *</Label>
                <Input
                  id="zipCode"
                  value={customerInfo.zipCode}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder={t(language, 'zipCodePlaceholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">{t(language, 'country')} *</Label>
                <Select value={customerInfo.country} onValueChange={(value) => setCustomerInfo(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t(language, 'selectCountry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">{t(language, 'phoneNumber')}</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t(language, 'phoneOptional')}
              />
            </div>

            <div>
              <Label htmlFor="email">{t(language, 'email')}</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t(language, 'emailOptional')}
              />
            </div>
          </div>

          {/* Shipping Method */}
          <div className="space-y-4">
            <Label>{t(language, 'shippingMethod')} *</Label>
            <Select value={selectedShipping} onValueChange={setSelectedShipping}>
              <SelectTrigger>
                <SelectValue placeholder={t(language, 'selectShippingMethod')} />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} - ${option.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{t(language, 'subtotal')}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{t(language, 'shipping')} ({shippingOption?.name})</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{t(language, 'tax')} (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-medium">
              <span>{t(language, 'total')}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitOrder}
            disabled={isProcessing || !customerInfo.name || !customerInfo.address1 || 
                     !customerInfo.city || !customerInfo.zipCode || !customerInfo.country}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">○</span>
                {t(language, 'processingOrder')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t(language, 'placeOrder')}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}