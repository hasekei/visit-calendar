export interface Database {
  public: {
    Tables: {
      visitors: {
        Row: {
          id: string;
          name: string;
          color: string;
          sort_order: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          sort_order?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          sort_order?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          visitor_id: string;
          start_time: string;
          end_time: string;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          start_time: string;
          end_time: string;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          visitor_id?: string;
          start_time?: string;
          end_time?: string;
          memo?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visits_visitor_id_fkey";
            columns: ["visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors";
            referencedColumns: ["id"];
          }
        ];
      };
      visitor_images: {
        Row: {
          id: string;
          visitor_id: string;
          storage_path: string;
          filename: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          storage_path: string;
          filename: string;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          filename?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visitor_images_visitor_id_fkey";
            columns: ["visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          username: string;
          message: string;
          created_at: string;
          seen_by: string[];
        };
        Insert: {
          id?: string;
          username: string;
          message: string;
          created_at?: string;
          seen_by?: string[];
        };
        Update: {
          seen_by?: string[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
