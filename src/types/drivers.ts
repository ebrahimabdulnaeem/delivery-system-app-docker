export interface Driver {
  id: string;
  driver_name: string;
  driver_phone: string;
  driver_id_number?: string;
  assigned_areas?: string[];
  created_at?: string;
  updated_at?: string;
} 