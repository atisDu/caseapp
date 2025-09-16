export interface DesignData {
  id?: string;
  user_id: string;
  name: string;
  image_url: string;
  phone_model: string;
  material: string;
  created_at?: string;
  updated_at?: string;
}

export interface Design extends DesignData {
  id: string;  // Required in the extended interface
}