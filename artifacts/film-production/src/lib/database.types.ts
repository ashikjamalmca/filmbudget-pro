export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'producer' | 'accounts' | 'production-manager' | 'viewer';
export type PaymentStatus = 'pending' | 'partial' | 'complete';
export type DocumentFileType = 'pdf' | 'image' | 'excel' | 'other';

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string | null;
          logo_url: string | null;
          is_active: boolean;
          suspended_at: string | null;
          suspension_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan_name: string;
          valid_from: string;
          valid_until: string | null;
          max_users: number;
          max_projects: number;
          max_storage_gb: number;
          is_active: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          tenant_id: string | null;
          is_super_admin: boolean;
          assigned_project_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          tenant_id: string | null;
          title: string;
          date_range: string;
          total_budget: number;
          poster_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          tenant_id: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>;
      };
      daily_expenses: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string | null;
          expense_date: string;
          department: string;
          account_head: string;
          amount: number;
          nos: number;
          total: number;
          bill_url: string | null;
          paid_by: string | null;
          description: string | null;
          pay_method: string | null;
          reference_no: string | null;
          category_id: string | null;
          subcategory_id: string | null;
          remuneration_entry_id: string | null;
          added_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['daily_expenses']['Insert']>;
      };
      budget_allocations: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string | null;
          department: string;
          allocated_amount: number;
          notes: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budget_allocations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['budget_allocations']['Insert']>;
      };
      remuneration_entries: {
        Row: {
          id: string;
          tenant_id: string | null;
          project_id: string;
          department: string;
          role: string;
          person_name: string;
          item_service: string | null;
          agreed_amount: number;
          paid_amount: number;
          balance_amount: number;
          status: PaymentStatus;
          paid_by: string | null;
          payment_date: string | null;
          remarks: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['remuneration_entries']['Row'], 'id' | 'balance_amount' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['remuneration_entries']['Insert']>;
      };
      remuneration_payments: {
        Row: {
          id: string;
          remuneration_id: string;
          tenant_id: string | null;
          amount: number;
          payment_date: string;
          paid_by: string | null;
          remarks: string | null;
          expense_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['remuneration_payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['remuneration_payments']['Insert']>;
      };
      artists: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string | null;
          name: string;
          role: string;
          budget: number;
          paid: number;
          balance: number;
          status: PaymentStatus;
          notes: string;
          contract_url: string | null;
          type: 'artist' | 'technician';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['artists']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['artists']['Insert']>;
      };
      music_expenses: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string | null;
          role: string;
          description: string;
          budget: number;
          paid: number;
          balance: number;
          remarks: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['music_expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['music_expenses']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          tenant_id: string | null;
          name: string;
          file_type: DocumentFileType;
          department: string;
          linked_expense: string | null;
          storage_path: string;
          file_size: string;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      payment_status: PaymentStatus;
      document_file_type: DocumentFileType;
    };
  };
}
