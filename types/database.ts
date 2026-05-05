export interface Database {
  public: {
    Tables: {
      visitors: {
        Row: {
          id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          sort_order?: number;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
