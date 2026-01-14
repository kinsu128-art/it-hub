export type AssetStatus = 'assigned' | 'in_stock' | 'repair' | 'disposed';
export type ServerStatus = 'active' | 'inactive' | 'maintenance' | 'disposed';
export type PrinterStatus = 'active' | 'inactive' | 'repair' | 'disposed';
export type SoftwareStatus = 'active' | 'expired' | 'disposed';

export interface Pc {
  id: number;
  asset_number: string;
  user_name?: string;
  department?: string;
  model_name: string;
  serial_number?: string;
  purchase_date?: string;
  cpu?: string;
  ram?: string;
  disk?: string;
  status: AssetStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface Server {
  id: number;
  asset_number: string;
  rack_location?: string;
  hostname: string;
  os_version?: string;
  ip_address?: string;
  purpose?: string;
  warranty_expiry?: string;
  cpu?: string;
  ram?: string;
  disk?: string;
  status: ServerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface NetworkIp {
  id: number;
  ip_address: string;
  subnet_mask: string;
  gateway?: string;
  assigned_device?: string;
  vlan_id?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface Printer {
  id: number;
  asset_number: string;
  model_name: string;
  ip_address?: string;
  location?: string;
  toner_status?: string;
  drum_status?: string;
  vendor_name?: string;
  vendor_contact?: string;
  status: PrinterStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface Software {
  id: number;
  software_name: string;
  license_key?: string;
  purchased_quantity: number;
  allocated_quantity: number;
  expiry_date?: string;
  version?: string;
  vendor_name?: string;
  status: SoftwareStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface AssetHistory {
  id: number;
  asset_type: 'pc' | 'server' | 'network' | 'printer' | 'software';
  asset_id: number;
  action: 'create' | 'update' | 'delete' | 'dispose';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: number;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface DashboardStats {
  totalAssets: {
    pc: number;
    server: number;
    network: number;
    printer: number;
    software: number;
  };
  pcByStatus: Record<AssetStatus, number>;
  serverByStatus: Record<ServerStatus, number>;
  ipUsage: {
    total: number;
    used: number;
    available: number;
  };
  expiringSoftware: Software[];
  recentChanges: AssetHistory[];
}
