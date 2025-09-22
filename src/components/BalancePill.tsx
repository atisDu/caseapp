import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Copy, CreditCard, Euro } from 'lucide-react';
import { Language, t } from '../utils/translations';
import {
  getUserBalance,
  getPaymentSettings,
  createPaymentTransaction,
  generateTransactionId,
  PaymentSettings
} from '../utils/supabase/data';

interface BalancePillProps {
  userEmail: string;
  language: Language;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

export function BalancePill({ userEmail, language }: BalancePillProps) {
  const [balance, setBalance] = useState<number>(0);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user balance
  useEffect(() => {
    loadBalance();
    
    // Set up periodic refresh every 10 seconds to catch admin approvals
    const interval = setInterval(loadBalance, 10000);
    
    // Listen for balance change events (e.g., after orders are placed)
    const handleBalanceChange = (event: CustomEvent) => {
      if (event.detail?.userEmail === userEmail) {
        loadBalance();
      }
    };
    
    window.addEventListener('balanceChanged', handleBalanceChange as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('balanceChanged', handleBalanceChange as EventListener);
    };
  }, [userEmail]);

  // Load payment settings when dialog opens
  useEffect(() => {
    if (isTopUpOpen) {
      loadPaymentSettings();
      generateTransactionIdLocal();
      // Also refresh balance to ensure it's current
      loadBalance();
    }
  }, [isTopUpOpen]);

  const loadBalance = async () => {
    try {
      const balance = await getUserBalance(userEmail);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const settings = await getPaymentSettings();
      if (settings) {
        setPaymentSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  };

  const generateTransactionIdLocal = () => {
    const transactionId = generateTransactionId();
    setTransactionId(transactionId);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getCurrentAmount = () => {
    if (selectedAmount) return selectedAmount;
    const custom = parseFloat(customAmount);
    return !isNaN(custom) && custom > 0 ? custom : 0;
  };

  const handleConfirmPayment = async () => {
    const amount = getCurrentAmount();
    if (amount <= 0) return;

    setIsLoading(true);
    try {
      const transaction = await createPaymentTransaction(
        userEmail,
        amount,
        transactionId,
        'topup'
      );
      
      if (transaction) {
        // Refresh balance to ensure current data
        await loadBalance();
        
        // Reset form and close dialog
        setSelectedAmount(null);
        setCustomAmount('');
        setIsTopUpOpen(false);
        
        // Show success message
        alert(t(language, 'paymentPending'));
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      console.error('Failed to create payment transaction:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogTrigger asChild>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1 px-3 py-1"
          >
            <Euro className="w-3 h-3" />
            <span className="font-medium">€{balance.toFixed(2)}</span>
          </Badge>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t(language, 'topUpBalance')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Balance */}
            <div className="text-center">
              <Label className="text-sm text-muted-foreground">
                {t(language, 'currentBalance')}
              </Label>
              <div className="text-2xl font-bold">€{balance.toFixed(2)}</div>
            </div>

            {/* Preset Amounts */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t(language, 'presetAmounts')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    onClick={() => handleAmountSelect(amount)}
                    className="h-12"
                  >
                    €{amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="customAmount" className="text-sm font-medium">
                {t(language, 'customAmount')}
              </Label>
              <Input
                id="customAmount"
                type="number"
                placeholder={t(language, 'enterAmount')}
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                min="0.01"
                step="0.01"
                className="mt-1"
              />
            </div>

            {/* Payment Details */}
            {paymentSettings && getCurrentAmount() > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {t(language, 'paymentDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t(language, 'recipientName')}
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{paymentSettings.recipient_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(paymentSettings.recipient_name)}
                          className="h-4 w-4 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t(language, 'amount')}
                      </Label>
                      <div className="font-medium">€{getCurrentAmount().toFixed(2)}</div>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        {t(language, 'recipientIban')}
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm">{paymentSettings.iban_number}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(paymentSettings.iban_number)}
                          className="h-4 w-4 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        {t(language, 'transactionId')}
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {transactionId}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transactionId)}
                          className="h-4 w-4 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg text-xs">
                    <p className="font-medium mb-1">
                      {t(language, 'paymentInstructions')}:
                    </p>
                    <p>{t(language, 'paymentInstructionsText')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmPayment}
              disabled={getCurrentAmount() <= 0 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                t(language, 'pending')
              ) : (
                `${t(language, 'confirmPayment')} €${getCurrentAmount().toFixed(2)}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}