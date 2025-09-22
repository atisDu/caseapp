import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  Plus, 
  Minus, 
  Settings,
  Euro,
  Copy,
  User,
  Calendar
} from 'lucide-react';
import { Language, t } from '../utils/translations';
import {
  getPaymentTransactions,
  getAllUserBalances,
  getPaymentSettings,
  updateTransactionStatus,
  createPaymentTransaction,
  updatePaymentSettings,
  getUniqueUserEmails,
  PaymentTransaction,
  PaymentSettings,
  UserBalance
} from '../utils/supabase/data';

interface PaymentManagementProps {
  language: Language;
  adminEmail: string;
}

export function PaymentManagement({ language, adminEmail }: PaymentManagementProps) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Manual adjustment states
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<PaymentSettings>>({});
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  // Reload transactions when status filter changes
  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTransactions(),
        loadUserBalances(),
        loadPaymentSettings()
      ]);
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await getPaymentTransactions(statusFilter);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadUserBalances = async () => {
    try {
      const data = await getAllUserBalances();
      setUserBalances(data);
    } catch (error) {
      console.error('Failed to load user balances:', error);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const data = await getPaymentSettings();
      if (data) {
        setPaymentSettings(data);
        setSettingsForm(data);
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  };

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'decline') => {
    setIsLoading(true);
    try {
      const status = action === 'approve' ? 'approved' : 'declined';
      const success = await updateTransactionStatus(transactionId, status, adminEmail);
      
      if (success) {
        // Reload data to reflect changes
        await loadTransactions();
        await loadUserBalances();
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      console.error(`Failed to ${action} transaction:`, error);
      alert(`Failed to ${action} transaction. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAdjustment = async () => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason) return;
    
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsLoading(true);
    try {
      const transactionType = adjustmentType === 'add' ? 'manual_add' : 'manual_deduct';
      
      const transaction = await createPaymentTransaction(
        selectedUser,
        amount,
        `MAN${Date.now()}`,
        transactionType,
        adminEmail,
        adjustmentReason
      );
      
      if (transaction) {
        // Reset form
        setSelectedUser('');
        setAdjustmentAmount('');
        setAdjustmentReason('');
        setIsAdjustmentOpen(false);
        
        // Reload data
        await loadTransactions();
        await loadUserBalances();
      } else {
        throw new Error('Failed to create manual adjustment');
      }
    } catch (error) {
      console.error('Failed to create manual adjustment:', error);
      alert('Failed to create manual adjustment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.iban_number || !settingsForm.recipient_name) return;
    
    setIsLoading(true);
    try {
      const success = await updatePaymentSettings(settingsForm);
      
      if (success) {
        await loadPaymentSettings(); // Reload to get updated data
        setIsSettingsOpen(false);
      } else {
        throw new Error('Failed to update payment settings');
      }
    } catch (error) {
      console.error('Failed to update payment settings:', error);
      alert('Failed to update payment settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t(language, 'pending')}
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <Check className="w-3 h-3" />
          {t(language, 'approved')}
        </Badge>;
      case 'declined':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <X className="w-3 h-3" />
          {t(language, 'declined')}
        </Badge>;
      default:
        return null;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      topup: 'default',
      manual_add: 'secondary',
      manual_deduct: 'outline'
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants] || 'default'}>
      {t(language, type as any)}
    </Badge>;
  };

  const filteredTransactions = transactions.filter(t => 
    statusFilter === 'all' || t.status === statusFilter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'lv' ? 'lv-LV' : 'en-US');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const uniqueUsers = Array.from(new Set([
    ...transactions.map(t => t.user_email),
    ...userBalances.map(b => b.user_email)
  ]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t(language, 'paymentManagement')}</h2>
          <p className="text-muted-foreground">
            {t(language, 'transactionHistory')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t(language, 'manualAdjustment')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t(language, 'manualAdjustment')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t(language, 'selectUser')}</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder={t(language, 'selectUser')} />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueUsers.map(email => (
                        <SelectItem key={email} value={email}>{email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t(language, 'transactionType')}</Label>
                    <Select value={adjustmentType} onValueChange={(value: 'add' | 'deduct') => setAdjustmentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">{t(language, 'addBalance')}</SelectItem>
                        <SelectItem value="deduct">{t(language, 'deductBalance')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>{t(language, 'adjustmentAmount')}</Label>
                    <Input
                      type="number"
                      placeholder={t(language, 'enterAmount')}
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{t(language, 'adjustmentReason')}</Label>
                  <Textarea
                    placeholder={t(language, 'enterReason')}
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleManualAdjustment}
                  disabled={!selectedUser || !adjustmentAmount || !adjustmentReason || isLoading}
                  className="w-full"
                >
                  {adjustmentType === 'add' ? t(language, 'addBalance') : t(language, 'deductBalance')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t(language, 'paymentSettings')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t(language, 'updatePaymentSettings')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t(language, 'recipientName')}</Label>
                  <Input
                    value={settingsForm.recipient_name || ''}
                    onChange={(e) => setSettingsForm(prev => ({...prev, recipient_name: e.target.value}))}
                  />
                </div>
                
                <div>
                  <Label>{t(language, 'recipientIban')}</Label>
                  <Input
                    value={settingsForm.iban_number || ''}
                    onChange={(e) => setSettingsForm(prev => ({...prev, iban_number: e.target.value}))}
                  />
                </div>
                
                <div>
                  <Label>{t(language, 'bankName')}</Label>
                  <Input
                    value={settingsForm.bank_name || ''}
                    onChange={(e) => setSettingsForm(prev => ({...prev, bank_name: e.target.value}))}
                  />
                </div>
                
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!settingsForm.iban_number || !settingsForm.recipient_name || isLoading}
                  className="w-full"
                >
                  {t(language, 'saveSettings')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">{t(language, 'transactionHistory')}</TabsTrigger>
          <TabsTrigger value="balances">{t(language, 'balance')}</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">{t(language, 'pendingPayments')}</SelectItem>
                <SelectItem value="approved">{t(language, 'approvedPayments')}</SelectItem>
                <SelectItem value="declined">{t(language, 'declinedPayments')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{transaction.user_email}</span>
                        {getTransactionTypeBadge(transaction.transaction_type)}
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          <span className="font-medium">{transaction.amount_euros.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{transaction.transaction_id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(transaction.transaction_id)}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                      </div>
                      
                      {transaction.notes && (
                        <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                      )}
                      
                      {transaction.approved_by && (
                        <p className="text-xs text-muted-foreground">
                          {t(language, 'approvedBy')}: {transaction.approved_by}
                        </p>
                      )}
                    </div>
                    
                    {transaction.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransactionAction(transaction.id, 'decline')}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t(language, 'decline')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleTransactionAction(transaction.id, 'approve')}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t(language, 'approve')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTransactions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userBalances.map((balance) => (
              <Card key={balance.user_email}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {balance.user_email}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balance.balance_euros.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated: {formatDate(balance.updated_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}