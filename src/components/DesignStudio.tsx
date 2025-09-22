import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DrawingCanvas } from './DrawingCanvas';
import { OrderPreview } from './OrderPreview';
import { DesignGallery } from './DesignGallery';
import { PhoneCaseMockup } from './PhoneCaseMockup';
import { Design, Order, User } from '../App';
import { Upload, Palette, Eye, ShoppingCart, Save, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Language, t } from '../utils/translations';
import { supabase } from '../utils/supabase/client';

interface PhoneModel {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface Material {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

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
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDesign, setCurrentDesign] = useState<Design | null>(null);
  const [designName, setDesignName] = useState('');
  const [selectedPhoneModel, setSelectedPhoneModel] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProductData();
  }, []);

  const loadProductData = async () => {
    setLoading(true);
    try {
      // Load phone models
      const { data: phoneData, error: phoneError } = await supabase
        .from('phone_models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (phoneError) {
        console.error('Error loading phone models:', phoneError);
      } else {
        setPhoneModels(phoneData || []);
      }

      // Load materials
      const { data: materialData, error: materialError } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (materialError) {
        console.error('Error loading materials:', materialError);
      } else {
        setMaterials(materialData || []);
        // Set default material if available
        if (materialData && materialData.length > 0) {
          setSelectedMaterial(materialData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      alert(t(language, 'designNameRequired'));
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
      alert(t(language, 'failedToSave'));
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
      alert(t(language, 'saveDesignFirst'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <p>Loading product data...</p>
        </div>
      </div>
    );
  }

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
                    {phoneModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} - ${model.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material">{t(language, 'material')}</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder={t(language, 'selectMaterial')}>
                      {selectedMaterial && materials.find(m => m.id === selectedMaterial)?.name}
                    </SelectValue>
                  </SelectTrigger>  
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
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
                    {phoneModels.find(m => m.id === selectedPhoneModel)?.name || selectedPhoneModel}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="aspect-[75/159] rounded-lg flex items-center justify-center relative max-w-[280px] mx-auto">
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
            <DialogDescription>
              {t(language, 'drawYourDesign')}
            </DialogDescription>
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
              <DialogDescription>
                {t(language, 'reviewAndConfirmOrder')}
              </DialogDescription>
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