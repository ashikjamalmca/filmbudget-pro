export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'producer' | 'accounts' | 'production-manager' | 'viewer';
export type PaymentStatus = 'pending' | 'partial' | 'complete';
export type DocumentFileType = 'pdf' | 'image' | 'excel' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
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
      daily_expenses: {
        Row: {
          id: string;
          project_id: string;
          expense_date: string;
          department: string;
          account_head: string;
          amount: number;
          nos: number;
          total: number;
          bill_url: string | null;
          added_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['daily_expenses']['Insert']>;
      };
      artists: {
        Row: {
          id: string;
          project_id: string;
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
