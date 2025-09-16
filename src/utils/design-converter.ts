import { Design as SupabaseDesign } from '../types/design';

// Legacy App Design type
export interface AppDesign {
  id: string;
  name: string;
  imageDataUrl?: string;
  phoneModel: string;
  material: string;
  createdAt: Date;
}

// Convert Supabase Design to App Design format
export const convertSupabaseDesign = (design: SupabaseDesign): AppDesign => {
  return {
    id: design.id,
    name: design.name,
    imageDataUrl: design.image_url,
    phoneModel: design.phone_model,
    material: design.material,
    createdAt: new Date(design.created_at || Date.now())
  };
};

export const convertAppDesign = (design: AppDesign): Omit<SupabaseDesign, 'id' | 'created_at' | 'updated_at'> => {
  return {
    user_id: '', // This needs to be set by the component
    name: design.name,
    image_url: design.imageDataUrl || '',
    phone_model: design.phoneModel,
    material: design.material
  };
};