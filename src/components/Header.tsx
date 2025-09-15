import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Smartphone, Shield, Languages, LogOut } from 'lucide-react';
import { User } from '../App';
import { Language, t } from '../utils/translations';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

export function Header({ user, onLogout, language, onToggleLanguage }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">{t(language, 'appTitle')}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t(language, 'appSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLanguage}
              className="flex items-center gap-1"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'lv' ? t(language, 'latvian') : t(language, 'english')}
              </span>
              <span className="sm:hidden">
                {language === 'lv' ? 'LV' : 'EN'}
              </span>
            </Button>

            <div className="flex items-center gap-1 sm:gap-2">
              {user.isAdmin && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span className="hidden sm:inline">{t(language, 'admin')}</span>
                </Badge>
              )}
              <div className="text-right">
                <p className="font-medium text-sm sm:text-base">{user.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {language === 'lv' ? 'Iziet' : 'Logout'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}