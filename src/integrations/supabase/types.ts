export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          reviewed_at: string | null
          reviewed_by_id: string | null
          reviewed_by_name: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          reviewed_by_name?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          reviewed_by_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_requests_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          account_number: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          representative_name: string | null
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          representative_name?: string | null
        }
        Update: {
          account_number?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          representative_name?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          created_by_id: string
          created_by_name: string
          deducted_at: string | null
          deducted_by_id: string | null
          deducted_by_name: string | null
          description: string
          expense_date: string
          id: string
          is_deducted: boolean
          notes: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by_id: string
          created_by_name: string
          deducted_at?: string | null
          deducted_by_id?: string | null
          deducted_by_name?: string | null
          description: string
          expense_date?: string
          id?: string
          is_deducted?: boolean
          notes?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by_id?: string
          created_by_name?: string
          deducted_at?: string | null
          deducted_by_id?: string | null
          deducted_by_name?: string | null
          description?: string
          expense_date?: string
          id?: string
          is_deducted?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          company: string | null
          created_at: string
          id: string
          last_updated: string
          name: string
          notes: string | null
          repeat_count: number | null
          scientific_name: string | null
          status: string
          updated_by_id: string | null
          updated_by_name: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          name: string
          notes?: string | null
          repeat_count?: number | null
          scientific_name?: string | null
          status: string
          updated_by_id?: string | null
          updated_by_name?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          name?: string
          notes?: string | null
          repeat_count?: number | null
          scientific_name?: string | null
          status?: string
          updated_by_id?: string | null
          updated_by_name?: string | null
        }
        Relationships: []
      }
      notification_read_status: {
        Row: {
          id: string
          is_read: boolean
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_read?: boolean
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_read?: boolean
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_read_status_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_read_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient: string
          sender_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient: string
          sender_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient?: string
          sender_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          body: string
          created_at: string
          id: string
          notification_type: string
          sent_at: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          notification_type?: string
          sent_at?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          notification_type?: string
          sent_at?: string
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          attachment_url: string | null
          company_name: string
          created_at: string
          created_by_id: string
          created_by_name: string
          deducted_at: string | null
          deducted_by_id: string | null
          deducted_by_name: string | null
          id: string
          is_deducted: boolean
          notes: string | null
          payment_date: string
          payment_type: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          company_name: string
          created_at?: string
          created_by_id: string
          created_by_name: string
          deducted_at?: string | null
          deducted_by_id?: string | null
          deducted_by_name?: string | null
          id?: string
          is_deducted?: boolean
          notes?: string | null
          payment_date?: string
          payment_type: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          company_name?: string
          created_at?: string
          created_by_id?: string
          created_by_name?: string
          deducted_at?: string | null
          deducted_by_id?: string | null
          deducted_by_name?: string | null
          id?: string
          is_deducted?: boolean
          notes?: string | null
          payment_date?: string
          payment_type?: string
        }
        Relationships: []
      }
      periodic_notification_state: {
        Row: {
          created_at: string
          current_message_index: number
          id: string
          last_sent_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_message_index?: number
          id?: string
          last_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_message_index?: number
          id?: string
          last_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_guide: {
        Row: {
          barcode: string | null
          concentration: string | null
          created_at: string
          expiry_date: string | null
          id: string
          keywords: string[] | null
          origin: string | null
          pharmacist_notes: string | null
          price: number | null
          quantity: number | null
          scientific_name: string | null
          trade_name: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          concentration?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          keywords?: string[] | null
          origin?: string | null
          pharmacist_notes?: string | null
          price?: number | null
          quantity?: number | null
          scientific_name?: string | null
          trade_name: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          concentration?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          keywords?: string[] | null
          origin?: string | null
          pharmacist_notes?: string | null
          price?: number | null
          quantity?: number | null
          scientific_name?: string | null
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          fcm_token: string | null
          id: string
          name: string | null
          notifications_enabled: boolean
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          fcm_token?: string | null
          id: string
          name?: string | null
          notifications_enabled?: boolean
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          fcm_token?: string | null
          id?: string
          name?: string | null
          notifications_enabled?: boolean
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          created_at: string
          created_by_id: string
          created_by_name: string
          date: string
          id: string
          notes: string | null
          period: string
          service_name: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by_id: string
          created_by_name: string
          date: string
          id?: string
          notes?: string | null
          period: string
          service_name?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by_id?: string
          created_by_name?: string
          date?: string
          id?: string
          notes?: string | null
          period?: string
          service_name?: string | null
          type?: string
        }
        Relationships: []
      }
      supplies: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          name: string
          notes: string | null
          repeat_count: number | null
          status: string
          updated_by_id: string | null
          updated_by_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          name: string
          notes?: string | null
          repeat_count?: number | null
          status: string
          updated_by_id?: string | null
          updated_by_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          name?: string
          notes?: string | null
          repeat_count?: number | null
          status?: string
          updated_by_id?: string | null
          updated_by_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      send_notification_to_role: {
        Args: {
          p_message: string
          p_recipient_role: string
          p_sender_id: string
          p_title: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "ahmad_rajili"
        | "morning_shift"
        | "evening_shift"
        | "night_shift"
        | "member"
        | "abdulwahab"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "ahmad_rajili",
        "morning_shift",
        "evening_shift",
        "night_shift",
        "member",
        "abdulwahab",
      ],
    },
  },
} as const
