import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DrawingCanvas } from './DrawingCanvas';
import { OrderPreview } from './OrderPreview';
import { DesignGallery } from './DesignGallery';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Order, User } from '../App';
import { AppDesign, convertAppDesign, convertSupabaseDesign } from '../types/app-design';
import { format } from 'date-fns';
import { Upload, Palette, Eye, ShoppingCart, Save, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Language, t } from '../utils/translations';
import { createDesign, getDesigns, supabase } from '../utils/supabase/client';
import { Design, DesignData } from '../types/design';

const MATERIALS = [{ id: 'tpu-gel', name: 'TPU/Gel'}];

const PHONE_MODELS = [
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', price: 29.99 },
  { id: 'iphone-15', name: 'iPhone 15', price: 27.99 },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', price: 29.99 },
  { id: 'iphone-14', name: 'iPhone 14', price: 27.99 },
  { id: 'samsung-s24', name: 'Samsung Galaxy S24', price: 28.99 },
  { id: 'samsung-s23', name: 'Samsung Galaxy S23', price: 26.99 },
  { id: 'pixel-8-pro', name: 'Google Pixel 8 Pro', price: 28.99 },
  { id: 'pixel-8', name: 'Google Pixel 8', price: 26.99 },
];

interface DesignStudioProps {
  designs: Design[];
  onAddDesign: (designs: Design[]) => void;
  onUpdateDesign: (designId: string, updates: Partial<Design>) => void;
  onDeleteDesign: (designId: string) => void;
  onCreateOrder: (orderId: string) => void;
  currentUser: User;
  language: Language;
}

export function DesignStudio({
  designs,
  onAddDesign,
  onUpdateDesign,
  onDeleteDesign,
  onCreateOrder,
  currentUser,
  language
}: DesignStudioProps) {
  const [currentDesign, setCurrentDesign] = useState<Design | null>(null);
  const [designName, setDesignName] = useState<string>('');
  const [selectedPhoneModel, setSelectedPhoneModel] = useState<string>(PHONE_MODELS[0].id);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('tpu-gel');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDesigns = async () => {
      if (currentUser) {
        const userDesigns = await getDesigns(currentUser.id);
        onAddDesign(userDesigns);
      }
    };
    loadDesigns();
  }, [currentUser]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setUploadedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

    const handleSaveDesign = async () => {
    if (!currentUser) return;
    
    try {
      const design: Omit<DesignData, 'id' | 'created_at' | 'updated_at'> = {
        user_id: currentUser.id,
        name: designName,
        image_url: uploadedImage || '',
        phone_model: selectedPhoneModel,
        material: selectedMaterial,
      };

      const savedDesign = await createDesign(design);
      const updatedDesigns = await getDesigns(currentUser.id);
      onAddDesign(updatedDesigns.map(convertSupabaseDesign));
      setCurrentDesign(convertSupabaseDesign(savedDesign));
      setShowDrawing(false);
    } catch (error) {
      console.error('Error saving design:', error);
    }
  };

  const handleNewDesign = () => {
    setCurrentDesign(null);
    setDesignName('');
    setSelectedPhoneModel(PHONE_MODELS[0].id);
    setSelectedMaterial('tpu-gel');
    setUploadedImage(null);
    setShowDrawing(false);
    setShowPreview(false);
  };

  const handleLoadDesign = (design: Design) => {
    setDesignName(design.name);
    setSelectedPhoneModel(design.phone_model);
    setSelectedMaterial(design.material);
    setUploadedImage(design.image_url);
    setCurrentDesign(design);
  };

  const handleOrderNow = () => {
    if (currentDesign) {
      setShowPreview(true);
    } else {
      alert('Please save your design first');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t(language, 'designStudio')}</h2>
          <p className="text-muted-foreground">{t(language, 'createCustomize')}</p>
        </div>
        <Button onClick={handleNewDesign} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t(language, 'newDesign')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t(language, 'designSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="design-name">{t(language, 'designName')}</Label>
                <Input
                  id="design-name"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder={t(language, 'enterDesignName')}
                />
              </div>

              <div>
                <Label htmlFor="phone-model">{t(language, 'phoneModel')}</Label>
                <Select value={selectedPhoneModel} onValueChange={setSelectedPhoneModel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t(language, 'selectPhoneModel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {t(language, model.id as any)} - ${model.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material">{t(language, 'material')}</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder={t(language, 'selectMaterial')} />
                  </SelectTrigger>  
                  <SelectContent>
                    {MATERIALS.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {t(language, material.id as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t(language, 'designMethod')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {t(language, 'uploadImage')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDrawing(true)}
                    className="flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    {t(language, 'draw')}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSaveDesign()} 
                  disabled={!designName || !selectedPhoneModel}
                  className="flex-1 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t(language, 'saveDesign')}
                </Button>
              </div>

              {currentDesign && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPreview(true)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t(language, 'preview')}
                  </Button>
                  <Button 
                    onClick={handleOrderNow}
                    className="flex-1 flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t(language, 'orderNow')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Design Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t(language, 'designPreview')}</span>
                {selectedPhoneModel && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {t(language, selectedPhoneModel as any)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="aspect-[3/4] rounded-lg flex items-center justify-center relative">
                {selectedPhoneModel ? (
                  <PhoneCaseMockup
                    phoneModel={selectedPhoneModel}
                    designImage={uploadedImage}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center p-8">
                      <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        {t(language, 'selectPhoneModelFirst')}
                      </p>
                      <p className="text-muted-foreground">
                        {t(language, 'choosePhoneModel')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Design Info */}
              {uploadedImage && selectedPhoneModel && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {t(language, 'designWillBePrinted')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Design Gallery */}
      <DesignGallery
        designs={designs.map(d => ({
          ...d,
          phoneModel: d.phone_model,
          createdAt: new Date(d.created_at || Date.now())
        }))}
        onLoadDesign={handleLoadDesign}
        onDeleteDesign={onDeleteDesign}
        onOrderDesign={(design) => {
          setCurrentDesign(design);
          setDesignName(design.name);
          setSelectedPhoneModel(design.phone_model);
          setUploadedImage(design.image_url);
          setShowPreview(true);
        }}
        language={language}
      />

      {/* Drawing Canvas Dialog */}
      <Dialog open={showDrawing} onOpenChange={setShowDrawing}>
        <DialogContent 
          className="max-w-[98vw] max-h-[95vh] w-full p-0 overflow-hidden"
          aria-describedby="design-canvas-description"
        >
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{t(language, 'designCanvas')}</DialogTitle>
            <p id="design-canvas-description" className="text-sm text-muted-foreground">
              {t(language, 'designMethod')}
            </p>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(95vh-80px)]">
            <DrawingCanvas
              initialImage={uploadedImage}
              onSave={handleSaveDesign}
              onCancel={() => setShowDrawing(false)}
              language={language}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Preview Dialog */}
      {currentDesign && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent 
            className="max-w-[95vw] w-full max-h-[90vh] p-0 overflow-hidden sm:max-w-2xl"
            aria-describedby="order-preview-description"
          >
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{t(language, 'orderPreview')}</DialogTitle>
              <p id="order-preview-description" className="text-sm text-muted-foreground">
                {t(language, 'customPhoneCase')}
              </p>
            </DialogHeader>
            <div className="overflow-auto max-h-[calc(90vh-80px)] p-6 pt-0">
              <OrderPreview
                design={{
                  ...currentDesign,
                  phoneModel: currentDesign.phone_model,
                  createdAt: new Date(currentDesign.created_at || Date.now())
                }}
                onCreateOrder={onCreateOrder}
                onClose={() => setShowPreview(false)}
                currentUser={currentUser}
                language={language}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}