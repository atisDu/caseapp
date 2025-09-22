import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { DesignStudio } from './components/DesignStudio';
import { OrderHistory } from './components/OrderHistory';
import { UserProfile } from './components/UserProfile';
import { CompanyDashboard } from './components/CompanyDashboard';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { ShoppingCart, User, Palette, Building } from 'lucide-react';
import { Language, t } from './utils/translations';
import { supabase } from './utils/supabase/client';


export interface Design {
  id: string;
  name: string;
  imageDataUrl?: string;
  phoneModel: string;
  material: string;
  preview?: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  designId: string;
  design: Design;
  quantity: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed';
  shippingAddress: string;
  totalPrice: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  customerInfo: {
    name: string;
    email: string;
    address: string;
  };
  phoneModel: string;
  shippingMethod: string;
  shippingPrice: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('design');
  const [language, setLanguage] = useState<Language>('lv'); // Latvian as default
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  

  // Check for existing session and load data on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('App initialization timeout - setting loading to false');
          setIsLoading(false);
        }, 10000); // 10 second timeout

        // Check for existing Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        if (error) {
          console.log('Session check error:', error.message);
          setIsLoading(false);
          return;
        } 
        
        if (session?.user) {
          const newUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            isAdmin: session.user.user_metadata?.isAdmin || false
          };
          setCurrentUser(newUser);
          await fetchUserData(session.user.id, newUser.isAdmin);
        }
      } catch (error: any) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const savedLanguage = localStorage.getItem('phonecase-language');
    if (savedLanguage) {
      setLanguage(savedLanguage as Language);
    }

    initializeApp();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const newUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          isAdmin: session.user.user_metadata?.isAdmin || false
        };
        
        setCurrentUser(newUser);
        
        // Fetch user data when auth state changes (but avoid duplicate calls)
        if (event === 'SIGNED_IN') {
          await fetchUserData(session.user.id, newUser.isAdmin);
        }
      } else {
        setCurrentUser(null);
        setDesigns([]);
        setOrders([]);
      }
      
      if (event === 'SIGNED_OUT') {
        setDesigns([]);
        setOrders([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Function to fetch user data (designs and orders)
  const fetchUserData = async (userId: string, isAdmin?: boolean) => {
    // Prevent duplicate fetching
    if (isFetchingData) {
      return;
    }

    setIsFetchingData(true);
    try {
      // Fetch designs from Supabase
      const { data: supabaseDesigns, error: designsError } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (designsError) {
        console.error('Error fetching designs:', designsError);
        throw designsError;
      }

      // Transform Supabase data to match your Design interface
      const transformedDesigns: Design[] = supabaseDesigns.map(d => ({
        id: d.id,
        name: d.name,
        imageDataUrl: d.image_url,
        phoneModel: d.phone_model,
        material: d.material,
        createdAt: new Date(d.created_at)
      }));

      setDesigns(transformedDesigns);

      // Fetch orders - if admin, fetch all orders, otherwise fetch user's orders
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          design:designs(*)
        `)
        .order('created_at', { ascending: false });

      // Only filter by user_id if not admin
      if (!isAdmin) {
        ordersQuery = ordersQuery.eq('user_id', userId);
      }

      const { data: supabaseOrders, error: ordersError } = await ordersQuery;

      if (ordersError) {
        // If orders table doesn't exist, just log and continue without orders
        if (ordersError.code === 'PGRST116' || ordersError.message.includes('relation "orders" does not exist')) {
          console.warn('Orders table does not exist yet. Please run the database setup SQL.');
          setOrders([]);
          return;
        }
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Transform orders data
      const transformedOrders: Order[] = supabaseOrders.map(o => ({
        id: o.id,
        userId: o.user_id,
        designId: o.design_id,
        design: {
          id: o.design.id,
          name: o.design.name,
          imageDataUrl: o.design.image_url,
          phoneModel: o.design.phone_model,
          material: o.design.material,
          createdAt: new Date(o.design.created_at)
        },
        status: o.status,
        shippingAddress: o.shipping_address,
        totalPrice: o.total_price || 0,
        unitPrice: o.unit_price || 0,
        subtotal: o.subtotal || 0,
        taxAmount: o.tax_amount || 0,
        taxRate: o.tax_rate || 0,
        customerInfo: {
          name: o.customer_name || '',
          email: o.customer_email || '',
          address: o.customer_address || '',
        },
        phoneModel: o.phone_model || '',
        shippingMethod: o.shipping_method || '',
        shippingPrice: o.shipping_price || 0,
        quantity: o.quantity,
        createdAt: new Date(o.created_at),
        updatedAt: new Date(o.updated_at)
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  // Update order status function
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  }, []);

  // Auto-complete shipped orders after 14 days
  useEffect(() => {
    const checkAndCompleteOrders = async () => {
      if (!currentUser) return;

      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Find shipped orders that are older than 14 days
      const ordersToComplete = orders.filter(order => 
        order.status === 'shipped' && 
        new Date(order.updatedAt) <= fourteenDaysAgo
      );

      // Update each order to completed status
      for (const order of ordersToComplete) {
        try {
          await updateOrderStatus(order.id, 'completed');
          console.log(`Auto-completed order ${order.id} after 14 days`);
        } catch (error) {
          console.error(`Failed to auto-complete order ${order.id}:`, error);
        }
      }
    };

    // Check immediately when orders change
    checkAndCompleteOrders();

    // Set up interval to check every hour
    const interval = setInterval(checkAndCompleteOrders, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [orders, currentUser, updateOrderStatus]);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('phonecase-language', language);
  }, [language]);

  // Save designs to localStorage whenever designs change
  useEffect(() => {
    localStorage.setItem('phonecase-designs', JSON.stringify(designs));
  }, [designs]);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('phonecase-orders', JSON.stringify(orders));
  }, [orders]);

  const addDesign = (design: Design) => {
    setDesigns(prev => [...prev, design]);
  };

  const updateDesign = (designId: string, updates: Partial<Design>) => {
    setDesigns(prev => prev.map(d => d.id === designId ? { ...d, ...updates } : d));
  };

  const deleteDesign = async (designId: string) => {
    try {
      // Delete from Supabase database
      const { error: dbError } = await supabase
        .from('designs')
        .delete()
        .eq('id', designId);

      if (dbError) throw dbError;

      // Delete image from storage
      const design = designs.find(d => d.id === designId);
      if (design?.imageDataUrl) {
        const fileName = design.imageDataUrl.split('/').pop(); // Get filename from URL
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('designs')
            .remove([fileName]);
          
          if (storageError) {
            console.error('Error deleting image:', storageError);
          }
        }
      }

      // Update local state
      setDesigns(prev => prev.filter(d => d.id !== designId));
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Failed to delete design. Please try again.');
    }
  };

  const addOrder = async (order: Order) => {
    try {
      const { data: savedOrder, error } = await supabase
        .from('orders')
        .insert({
          user_id: currentUser?.id,
          design_id: order.designId,
          status: 'pending',
          quantity: order.quantity,
          shipping_address: order.shippingAddress,
          total_price: order.totalPrice,
          unit_price: order.unitPrice,
          subtotal: order.subtotal,
          tax_amount: order.taxAmount,
          tax_rate: order.taxRate,
          customer_name: order.customerInfo.name,
          customer_email: order.customerInfo.email,
          customer_address: order.customerInfo.address,
          phone_model: order.phoneModel,
          shipping_method: order.shippingMethod,
          shipping_price: order.shippingPrice,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error details:', error);
        throw error;
      }

      const newOrder: Order = {
        id: savedOrder.id,
        userId: savedOrder.user_id,
        designId: savedOrder.design_id,
        status: savedOrder.status,
        shippingAddress: savedOrder.shipping_address || '',
        totalPrice: savedOrder.total_price || 0,
        unitPrice: savedOrder.unit_price || 0,
        subtotal: savedOrder.subtotal || 0,
        taxAmount: savedOrder.tax_amount || 0,
        taxRate: savedOrder.tax_rate || 0,
        customerInfo: {
          name: savedOrder.customer_name || '',
          email: savedOrder.customer_email || '',
          address: savedOrder.customer_address || '',
        },
        phoneModel: savedOrder.phone_model || '',
        shippingMethod: savedOrder.shipping_method || '',
        shippingPrice: savedOrder.shipping_price || 0,
        quantity: savedOrder.quantity,
        createdAt: new Date(savedOrder.created_at),
        updatedAt: new Date(savedOrder.updated_at),
        design: order.design
      };

      setOrders(prev => [...prev, newOrder]);
    } catch (error: any) {
      console.error('Error adding order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'lv' ? 'en' : 'lv');
  };

  const handleAuth = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      console.log('Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('Sign out error:', error.message);
      } else {
        console.log('User signed out successfully');
      }
    } catch (error: any) {
      console.log('Sign out exception:', error.message);
    }
    setCurrentUser(null);
    setActiveTab('design');
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (!currentUser) {
    return <AuthForm onAuth={handleAuth} language={language} />;
  }


  return (
    
    <div className="min-h-screen bg-background">
      <Header 
        user={currentUser} 
        onLogout={handleLogout}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
      
      <div className="container mx-auto p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${currentUser.isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="design" className="flex items-center gap-1 sm:gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">{t(language, 'designStudio')}</span>
              <span className="sm:hidden">{t(language, 'design')}</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 sm:gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t(language, 'orders')}</span>
              <span className="sm:hidden">{t(language, 'orders')}</span>
              {orders.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {orders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t(language, 'profile')}</span>
              <span className="sm:hidden">{t(language, 'profile')}</span>
            </TabsTrigger>
            {currentUser.isAdmin && (
              <TabsTrigger value="company" className="flex items-center gap-1 sm:gap-2">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">{t(language, 'company')}</span>
                <span className="sm:hidden">{t(language, 'company')}</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="design" className="mt-6">
            <DesignStudio 
              designs={designs}
              onAddDesign={addDesign}
              onUpdateDesign={updateDesign}
              onDeleteDesign={deleteDesign}
              onCreateOrder={addOrder}
              currentUser={currentUser}
              language={language}
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrderHistory 
              orders={orders.filter(o => o.userId === currentUser.id)}
              onUpdateOrder={updateOrderStatus}
              language={language}
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <UserProfile 
              user={currentUser}
              onUpdateUser={setCurrentUser}
              designs={designs}
              orders={orders.filter(o => !currentUser.isAdmin)}
              language={language}
            />
          </TabsContent>

          {currentUser.isAdmin && (
            <TabsContent value="company" className="mt-6">
              <CompanyDashboard 
                orders={orders}
                onUpdateOrderStatus={updateOrderStatus}
                designs={designs}
                language={language}
              />
            </TabsContent>
          )}
        </Tabs>
        
        
        
      </div>
    </div>
    
  );

  
}