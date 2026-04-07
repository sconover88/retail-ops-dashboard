export type UserRole = "manager" | "assistant";

export interface Store {
  id: string;
  name: string;
  address: string | null;
  manager_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export interface Inventory {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  reorder_point: number;
  last_updated: string;
}

export interface Sale {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  promo_code: string | null;
  sale_date: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserStore {
  user_id: string;
  store_id: string;
}

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: Store;
        Insert: Omit<Store, "id" | "created_at">;
        Update: Partial<Omit<Store, "id" | "created_at">>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at">;
        Update: Partial<Omit<Product, "id" | "created_at">>;
        Relationships: [];
      };
      inventory: {
        Row: Inventory;
        Insert: Omit<Inventory, "id" | "last_updated">;
        Update: Partial<Omit<Inventory, "id" | "last_updated">>;
        Relationships: [];
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, "id" | "sale_date">;
        Update: Partial<Omit<Sale, "id" | "sale_date">>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      user_stores: {
        Row: UserStore;
        Insert: UserStore;
        Update: Partial<UserStore>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
