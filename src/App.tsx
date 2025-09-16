import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { DesignStudio } from './components/DesignStudio';
import { OrderHistory } from './components/OrderHistory';
import { UserProfile } from './components/UserProfile';
import { CompanyDashboard } from './components/CompanyDashboard';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { ShoppingCart, User as UserIcon, Palette, Building } from 'lucide-react';
import { Language, t } from './utils/translations';
import { supabase } from './utils/supabase/client';
import { Design } from './types/design';
import { Order } from './types/order';

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
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error.message);
        } else if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            isAdmin: session.user.user_metadata?.isAdmin || false
          });
        }
      } catch (error: any) {
        console.error('Session initialization error:', error.message);
      }

      setIsLoading(false);
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      const [designsResponse, ordersResponse] = await Promise.all([
        supabase.from('designs').select('*').eq('user_id', currentUser.id),
        supabase.from('orders').select('*, design:designs(*)').eq('user_id', currentUser.id)
      ]);

      if (designsResponse.error) {
        console.error('Error loading designs:', designsResponse.error);
      } else {
        setDesigns(designsResponse.data || []);
      }

      if (ordersResponse.error) {
        console.error('Error loading orders:', ordersResponse.error);
      } else {
        setOrders(ordersResponse.data || []);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleAuth = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setCurrentUser(null);
    setActiveTab('design');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm onAuth={handleAuth} language={language} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={currentUser} 
        onLogout={handleLogout}
        language={language}
        onToggleLanguage={() => setLanguage(prev => prev === 'lv' ? 'en' : 'lv')}
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
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(language, 'profile')}</span>
              <span className="sm:hidden">{t(language, 'profile')}</span>
            </TabsTrigger>

            {currentUser.isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-1 sm:gap-2">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">{t(language, 'adminDashboard')}</span>
                <span className="sm:hidden">{t(language, 'admin')}</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="design" className="mt-4">
            <DesignStudio
              currentUser={currentUser}
              designs={designs}
              language={language}
              addDesign={design => setDesigns(prev => [...prev, design])}
              updateDesign={(id, updates) => setDesigns(prev => 
                prev.map(d => d.id === id ? { ...d, ...updates } : d)
              )}
              deleteDesign={id => setDesigns(prev => prev.filter(d => d.id !== id))}
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <OrderHistory
              orders={orders}
              designs={designs}
              language={language}
              currentUser={currentUser}
              updateOrderStatus={(id, status) => setOrders(prev =>
                prev.map(o => o.id === id ? { ...o, status } : o)
              )}
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <UserProfile
              user={currentUser}
              designs={designs}
              orders={orders}
              language={language}
            />
          </TabsContent>

          {currentUser.isAdmin && (
            <TabsContent value="admin" className="mt-4">
              <CompanyDashboard
                language={language}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
