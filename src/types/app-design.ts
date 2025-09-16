import { Design } from './design';

export interface AppDesign {
  id: string;
  name: string;
  phoneModel: string;
  material: string;
  imageDataUrl?: string;
  createdAt: Date;
}

export const convertSupabaseDesign = (design: Design): AppDesign => ({
  id: design.id,
  name: design.name,
  phoneModel: design.phone_model,
  material: design.material,
  imageDataUrl: design.image_url,
  createdAt: new Date(design.created_at || Date.now())
});

export const convertAppDesign = (design: AppDesign): Omit<Design, 'id' | 'user_id'> => ({
  name: design.name,
  phone_model: design.phoneModel,
  material: design.material,
  image_url: design.imageDataUrl || '',
  created_at: design.createdAt.toISOString()
});