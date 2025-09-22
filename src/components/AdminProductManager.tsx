import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Smartphone, 
  Package,
  Save,
  X
} from 'lucide-react';
import { Language, t } from '../utils/translations';
import { supabase } from '../utils/supabase/client';

interface PhoneModel {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Material {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AdminProductManagerProps {
  language: Language;
}

export function AdminProductManager({ language }: AdminProductManagerProps) {
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [editingPhoneModel, setEditingPhoneModel] = useState<PhoneModel | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showPhoneModelDialog, setShowPhoneModelDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);

  // Form states
  const [phoneModelForm, setPhoneModelForm] = useState({
    name: '',
    price: 0,
    is_active: true
  });
  
  const [materialForm, setMaterialForm] = useState({
    name: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load phone models
      const { data: phoneData, error: phoneError } = await supabase
        .from('phone_models')
        .select('*')
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
        .order('name');

      if (materialError) {
        console.error('Error loading materials:', materialError);
      } else {
        setMaterials(materialData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneModelForm = () => {
    setPhoneModelForm({
      name: '',
      price: 0,
      is_active: true
    });
    setEditingPhoneModel(null);
  };

  const resetMaterialForm = () => {
    setMaterialForm({
      name: '',
      is_active: true
    });
    setEditingMaterial(null);
  };

  const handleEditPhoneModel = (phoneModel: PhoneModel) => {
    setPhoneModelForm({
      name: phoneModel.name,
      price: phoneModel.price,
      is_active: phoneModel.is_active
    });
    setEditingPhoneModel(phoneModel);
    setShowPhoneModelDialog(true);
  };

  const handleEditMaterial = (material: Material) => {
    setMaterialForm({
      name: material.name,
      is_active: material.is_active
    });
    setEditingMaterial(material);
    setShowMaterialDialog(true);
  };

  const savePhoneModel = async () => {
    if (!phoneModelForm.name || phoneModelForm.price <= 0) {
      alert(t(language, 'fillAllRequiredFields'));
      return;
    }

    setSaving(true);
    try {
      if (editingPhoneModel) {
        // Update existing phone model
        const updateData = {
          name: phoneModelForm.name,
          price: phoneModelForm.price,
          is_active: phoneModelForm.is_active,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('phone_models')
          .update(updateData)
          .eq('id', editingPhoneModel.id);

        if (error) {
          console.error('Error updating phone model:', error);
          alert(t(language, 'errorSavingPhoneModel') + ': ' + error.message);
        } else {
          await loadData();
          setShowPhoneModelDialog(false);
          resetPhoneModelForm();
        }
      } else {
        // Create new phone model with auto-generated ID
        const generatedId = phoneModelForm.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .trim();

        const phoneModelData = {
          id: generatedId,
          name: phoneModelForm.name,
          price: phoneModelForm.price,
          is_active: phoneModelForm.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('phone_models')
          .insert([phoneModelData]);

        if (error) {
          console.error('Error creating phone model:', error);
          alert(t(language, 'errorSavingPhoneModel') + ': ' + error.message);
        } else {
          await loadData();
          setShowPhoneModelDialog(false);
          resetPhoneModelForm();
        }
      }
    } catch (error) {
      console.error('Error saving phone model:', error);
      alert(t(language, 'errorSavingPhoneModel'));
    } finally {
      setSaving(false);
    }
  };

  const saveMaterial = async () => {
    if (!materialForm.name) {
      alert(t(language, 'pleaseProvideMaterialName'));
      return;
    }

    setSaving(true);
    try {
      if (editingMaterial) {
        // Update existing material
        const updateData = {
          name: materialForm.name,
          is_active: materialForm.is_active,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('materials')
          .update(updateData)
          .eq('id', editingMaterial.id);

        if (error) {
          console.error('Error updating material:', error);
          alert(t(language, 'errorSavingMaterial') + ': ' + error.message);
        } else {
          await loadData();
          setShowMaterialDialog(false);
          resetMaterialForm();
        }
      } else {
        // Create new material with auto-generated ID
        const generatedId = materialForm.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .trim();

        const materialData = {
          id: generatedId,
          name: materialForm.name,
          is_active: materialForm.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('materials')
          .insert([materialData]);

        if (error) {
          console.error('Error creating material:', error);
          alert(t(language, 'errorSavingMaterial') + ': ' + error.message);
        } else {
          await loadData();
          setShowMaterialDialog(false);
          resetMaterialForm();
        }
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert(t(language, 'errorSavingMaterial'));
    } finally {
      setSaving(false);
    }
  };

  const deletePhoneModel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('phone_models')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting phone model:', error);
        alert(t(language, 'errorDeletingPhoneModel') + ': ' + error.message);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting phone model:', error);
      alert(t(language, 'errorDeletingPhoneModel'));
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting material:', error);
        alert(t(language, 'errorDeletingMaterial') + ': ' + error.message);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert(t(language, 'errorDeletingMaterial'));
    }
  };

  const togglePhoneModelStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('phone_models')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating phone model status:', error);
        alert(t(language, 'errorUpdatingStatus') + ': ' + error.message);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating phone model status:', error);
      alert(t(language, 'errorUpdatingStatus'));
    }
  };

  const toggleMaterialStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating material status:', error);
        alert(t(language, 'errorUpdatingStatus') + ': ' + error.message);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating material status:', error);
      alert(t(language, 'errorUpdatingStatus'));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>{t(language, 'loadingProductData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t(language, 'productManagement')}</h2>
      </div>

      <Tabs defaultValue="phone-models" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phone-models" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            {t(language, 'phoneModels')}
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t(language, 'caseMaterials')}
          </TabsTrigger>
        </TabsList>

        {/* Phone Models Tab */}
        <TabsContent value="phone-models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t(language, 'phoneModels')}</span>
                <Dialog open={showPhoneModelDialog} onOpenChange={setShowPhoneModelDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      resetPhoneModelForm();
                      setShowPhoneModelDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t(language, 'addPhoneModel')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPhoneModel ? t(language, 'editPhoneModel') : t(language, 'addPhoneModel')}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone-name">{t(language, 'modelName')}</Label>
                        <Input
                          id="phone-name"
                          value={phoneModelForm.name}
                          onChange={(e) => setPhoneModelForm({ ...phoneModelForm, name: e.target.value })}
                          placeholder="e.g., iPhone 15 Pro"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone-price">{t(language, 'modelPrice')}</Label>
                        <Input
                          id="phone-price"
                          type="number"
                          step="0.01"
                          value={phoneModelForm.price}
                          onChange={(e) => setPhoneModelForm({ ...phoneModelForm, price: parseFloat(e.target.value) || 0 })}
                          placeholder="29.99"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="phone-active"
                          checked={phoneModelForm.is_active}
                          onChange={(e) => setPhoneModelForm({ ...phoneModelForm, is_active: e.target.checked })}
                        />
                        <Label htmlFor="phone-active">{t(language, 'active')}</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowPhoneModelDialog(false);
                          resetPhoneModelForm();
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          {t(language, 'cancel')}
                        </Button>
                        <Button onClick={savePhoneModel} disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? t(language, 'saving') : t(language, 'save')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phoneModels.map((phoneModel) => (
                  <div key={phoneModel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{phoneModel.name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {phoneModel.id}</p>
                        <p className="text-sm font-medium">${phoneModel.price.toFixed(2)}</p>
                      </div>
                      <Badge variant={phoneModel.is_active ? "default" : "secondary"}>
                        {phoneModel.is_active ? t(language, 'active') : t(language, 'inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePhoneModelStatus(phoneModel.id, phoneModel.is_active)}
                      >
                        {phoneModel.is_active ? t(language, 'deactivate') : t(language, 'activate')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPhoneModel(phoneModel)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t(language, 'deletePhoneModel')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(language, 'deleteConfirmation').replace('{name}', phoneModel.name)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t(language, 'cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePhoneModel(phoneModel.id)}>
                              {t(language, 'deletePhoneModel')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {phoneModels.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">{t(language, 'noPhoneModelsFound')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t(language, 'caseMaterials')}</span>
                <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      resetMaterialForm();
                      setShowMaterialDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t(language, 'addMaterial')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingMaterial ? t(language, 'editMaterial') : t(language, 'addMaterial')}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="material-name">{t(language, 'materialName')}</Label>
                        <Input
                          id="material-name"
                          value={materialForm.name}
                          onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                          placeholder="e.g., TPU/Gel"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="material-active"
                          checked={materialForm.is_active}
                          onChange={(e) => setMaterialForm({ ...materialForm, is_active: e.target.checked })}
                        />
                        <Label htmlFor="material-active">{t(language, 'active')}</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowMaterialDialog(false);
                          resetMaterialForm();
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          {t(language, 'cancel')}
                        </Button>
                        <Button onClick={saveMaterial} disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? t(language, 'saving') : t(language, 'save')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{material.name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {material.id}</p>
                      </div>
                      <Badge variant={material.is_active ? "default" : "secondary"}>
                        {material.is_active ? t(language, 'active') : t(language, 'inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMaterialStatus(material.id, material.is_active)}
                      >
                        {material.is_active ? t(language, 'deactivate') : t(language, 'activate')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMaterial(material)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t(language, 'deleteMaterial')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(language, 'deleteConfirmation').replace('{name}', material.name)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t(language, 'cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMaterial(material.id)}>
                              {t(language, 'deleteMaterial')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">{t(language, 'noMaterialsFound')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}