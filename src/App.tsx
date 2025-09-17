import React, { useState, useEffect } from 'react';
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
  phoneModel: string;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  customerInfo: {
    name: string;
    email: string;
    address: string;
  };
  createdAt: Date;
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
  

  // Check for existing session and load data on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for existing Supabase session
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session check error:', error.message);
        } else if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            isAdmin: session.user.user_metadata?.isAdmin || false
          });
        } else {
          console.log('No existing session found');
        }

        // Fetch designs from Supabase
      if (session?.user) {
        const { data: supabaseDesigns, error: designsError } = await supabase
          .from('designs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (designsError) throw designsError;

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
      }

    } catch (error: any) {
      console.error('Error initializing app:', error);
    }
    setIsLoading(false);
  };

      

      
      const savedLanguage = localStorage.getItem('phonecase-language');
      
      
      if (savedLanguage) {
        setLanguage(savedLanguage as Language);
      }

    initializeApp();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          isAdmin: session.user.user_metadata?.isAdmin || false
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
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
              orders={orders.filter(o => !currentUser.isAdmin)}
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