import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Smartphone, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { Language, t } from '../utils/translations';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AuthFormProps {
  onAuth: (user: any) => void;
  language: Language;
}

export function AuthForm({ onAuth, language }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Supabase sign in
        console.log('Attempting to sign in user:', formData.email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.log('Sign in error:', error.message);
          throw new Error(language === 'lv' ? 'Nepareizi akreditācijas dati' : 'Invalid credentials');
        }

        if (data.user) {
          console.log('User signed in successfully:', data.user.id);
          onAuth({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            isAdmin: data.user.user_metadata?.isAdmin || false
          });
        }
      } else {
        // Supabase sign up via server
        if (!formData.name || !formData.email || !formData.password) {
          throw new Error(language === 'lv' ? 'Lūdzu aizpildiet visus laukus' : 'Please fill all fields');
        }

        console.log('Attempting to sign up user:', formData.email);
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-74848af3/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.log('Signup error:', result.error);
          throw new Error(result.error || (language === 'lv' ? 'Reģistrācijas kļūda' : 'Registration failed'));
        }

        console.log('User signed up successfully, now signing in...');
        
        // Sign in the newly created user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.log('Sign in after signup error:', error.message);
          throw new Error(language === 'lv' ? 'Reģistrācija veiksmīga, bet pieteikšanās neizdevās' : 'Registration successful, but sign in failed');
        }

        if (data.user) {
          console.log('User signed in after signup:', data.user.id);
          onAuth({
            id: data.user.id,
            name: data.user.user_metadata?.name || formData.name,
            email: data.user.email || '',
            isAdmin: data.user.user_metadata?.isAdmin || false
          });
        }
      }
    } catch (err: any) {
      console.log('Authentication error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t(language, 'appTitle')}</CardTitle>
          <p className="text-muted-foreground">{t(language, 'appSubtitle')}</p>
        </CardHeader>

        <CardContent>
          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => {
            setIsLogin(value === 'login');
            setError('');
            setFormData({ name: '', email: '', password: '' });
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                {language === 'lv' ? 'Pieteikties' : 'Sign In'}
              </TabsTrigger>
              <TabsTrigger value="register">
                {language === 'lv' ? 'Reģistrēties' : 'Sign Up'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t(language, 'email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t(language, 'enterEmail')}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === 'lv' ? 'Parole' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={language === 'lv' ? 'Ievadiet paroli' : 'Enter password'}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    language === 'lv' ? 'Pieslēdzas...' : 'Signing in...'
                  ) : (
                    language === 'lv' ? 'Pieteikties' : 'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">{t(language, 'fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={t(language, 'enterFullName')}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">{t(language, 'email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t(language, 'enterEmail')}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">
                    {language === 'lv' ? 'Parole' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={language === 'lv' ? 'Izveidojiet paroli' : 'Create password'}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    language === 'lv' ? 'Reģistrējas...' : 'Signing up...'
                  ) : (
                    language === 'lv' ? 'Reģistrēties' : 'Sign Up'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>{language === 'lv' ? 'Administratora pieejas dati:' : 'Admin access:'}</p>
            <p className="font-mono">admin@case.com / {"X'#22$<d1O0!"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}