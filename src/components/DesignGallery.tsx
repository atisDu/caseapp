import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Design } from '../App';
import { Eye, Trash2, Edit, Calendar, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Language, t } from '../utils/translations';

interface DesignGalleryProps {
  designs: Design[];
  onLoadDesign: (design: Design) => void;
  onDeleteDesign: (designId: string) => void;
  onOrderDesign: (design: Design) => void;
  language: Language;
}

export function DesignGallery({ designs, onLoadDesign, onDeleteDesign, onOrderDesign, language }: DesignGalleryProps) {
  if (designs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t(language, 'noDesigns')}</h3>
            <p>{t(language, 'savedDesigns')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          {t(language, 'yourDesigns')} ({designs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designs.map((design) => (
            <div key={design.id} className="group relative">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-3 overflow-hidden relative">
                    <PhoneCaseMockup
                      phoneModel={design.phoneModel}
                      designImage={design.imageDataUrl}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium truncate flex-1">{design.name}</h4>
                    </div>
                    
                    {design.phoneModel && (
                      <Badge variant="secondary" className="text-xs">
                        {design.phoneModel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {design.createdAt ? new Date(design.createdAt).toLocaleDateString() : '-'}
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => onOrderDesign(design)}
                        className="w-full flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        {t(language, 'orderNow')}
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onLoadDesign(design)}
                          className="flex-1 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          {t(language, 'edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(t(language, 'confirmDelete').replace('{name}', design.name))) {
                              onDeleteDesign(design.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}