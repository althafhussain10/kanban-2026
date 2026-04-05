export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string;
          title: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          description: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          title: string;
          description?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          title?: string;
          description?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
