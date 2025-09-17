import React, { useState, useRef } from 'react';
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
import { Design, Order, User } from '../App';
import { Upload, Palette, Eye, ShoppingCart, Save, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Language, t } from '../utils/translations';
import { supabase } from '../utils/supabase/client';

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
  onAddDesign: (design: Design) => void;
  onUpdateDesign: (designId: string, updates: Partial<Design>) => void;
  onDeleteDesign: (designId: string) => void;
  onCreateOrder: (order: Order) => void;
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
  const [designName, setDesignName] = useState('');
  const [selectedPhoneModel, setSelectedPhoneModel] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0].id);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setUploadedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDesign = async (canvasDataUrl?: string) => {
    if (!designName || !selectedPhoneModel) {
      alert('Please provide a design name and select a phone model');
      return;
    }
    try {
      const finalImageData = canvasDataUrl || uploadedImage;
      
      //Uploading of the image to Supabase
      let imageUrl = null;
      if (finalImageData) {
        // Convert base64 to blob
        const base64Data = finalImageData.split(',')[1];
        const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
        
        // Upload to Supabase storage
        const fileName = `${Date.now()}-${designName.replace(/\s+/g, '-')}.png`;
        
        const { data: imageData, error: uploadError } = await supabase.storage
          .from('designs')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('designs')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

    const {data: savedDesign, error: dbError } = await supabase
      .from('designs')
      .upsert({
        id: currentDesign?.id || undefined, // Let the DB generate ID for new designs
        user_id: currentUser.id,
        name: designName,
        image_url: imageUrl,
        created_at: currentDesign?.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone_model: selectedPhoneModel,
        material: selectedMaterial
      })
      .select()
      .single();
    if (dbError) throw dbError;
    
    // Update local state
      const design: Design = {
        id: savedDesign.id,
        name: savedDesign.name,
        imageDataUrl: imageUrl,
        phoneModel: savedDesign.phone_model,
        material: savedDesign.material,
        createdAt: new Date(savedDesign.created_at),
      };

    if (currentDesign) {
      onUpdateDesign(currentDesign.id, design);
    } else {
      onAddDesign(design);
    }

    setCurrentDesign(design);
    setShowDrawing(false);

    setDesignName('');
    setSelectedPhoneModel('');
    setSelectedMaterial('');
    setUploadedImage(null);
    //testēju ūdeņus
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    }
  };

  const handleNewDesign = () => {
    setCurrentDesign(null);
    setDesignName('');
    setSelectedPhoneModel('');
    setSelectedMaterial('');
    setUploadedImage(null);
    setShowDrawing(false);
    setShowPreview(false);
  };

  const handleLoadDesign = (design: Design) => {
    setCurrentDesign(design);
    setDesignName(design.name);
    setSelectedPhoneModel(design.phoneModel);
    setSelectedMaterial(design.material);
    setUploadedImage(design.imageDataUrl || null);
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
                    <SelectValue>{t(language, selectedMaterial as any)}</SelectValue>
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
        designs={designs}
        onLoadDesign={handleLoadDesign}
        onDeleteDesign={onDeleteDesign}
        onOrderDesign={(design) => {
          setCurrentDesign(design);
          setDesignName(design.name);
          setSelectedPhoneModel(design.phoneModel);
          setUploadedImage(design.imageDataUrl || null);
          setShowPreview(true);
        }}
        language={language}
      />

      {/* Drawing Canvas Dialog */}
      <Dialog open={showDrawing} onOpenChange={setShowDrawing}>
        <DialogContent className="max-w-[98vw] max-h-[95vh] w-full p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{t(language, 'designCanvas')}</DialogTitle>
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
          <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0 overflow-hidden sm:max-w-2xl">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{t(language, 'orderPreview')}</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[calc(90vh-80px)] p-6 pt-0">
              <OrderPreview
                design={currentDesign}
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