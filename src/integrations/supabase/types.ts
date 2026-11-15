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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          cep: string
          city: string
          complement: string | null
          created_at: string
          district: string
          id: string
          is_default: boolean
          label: string
          number: string
          phone: string | null
          recipient: string
          state: string
          street: string
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          created_at?: string
          district: string
          id?: string
          is_default?: boolean
          label?: string
          number: string
          phone?: string | null
          recipient: string
          state: string
          street: string
          user_id?: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          created_at?: string
          district?: string
          id?: string
          is_default?: boolean
          label?: string
          number?: string
          phone?: string | null
          recipient?: string
          state?: string
          street?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          carrier: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_cents: number
          id: string
          number: number
          paid_at: string | null
          payment_details: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_provider: string | null
          payment_provider_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_cents: number
          shipping_max_days: number | null
          shipping_min_days: number | null
          shipping_service: string
          status: Database["public"]["Enums"]["order_status"]
          stock_committed: boolean
          subtotal_cents: number
          total_cents: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          carrier?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          id?: string
          number?: never
          paid_at?: string | null
          payment_details?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_provider?: string | null
          payment_provider_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_cents: number
          shipping_max_days?: number | null
          shipping_min_days?: number | null
          shipping_service: string
          status?: Database["public"]["Enums"]["order_status"]
          stock_committed?: boolean
          subtotal_cents: number
          total_cents: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          carrier?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          id?: string
          number?: never
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_provider?: string | null
          payment_provider_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: Json
          shipping_cents?: number
          shipping_max_days?: number | null
          shipping_min_days?: number | null
          shipping_service?: string
          status?: Database["public"]["Enums"]["order_status"]
          stock_committed?: boolean
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          price_cents: number | null
          product_id: string
          sku: string | null
          sort_order: number
          stock: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price_cents?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price_cents?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          compare_at_cents: number | null
          created_at: string
          description: string
          id: string
          images: string[]
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_new: boolean
          name: string
          price_cents: number
          slug: string
          sold_count: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          compare_at_cents?: number | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_new?: boolean
          name: string
          price_cents: number
          slug: string
          sold_count?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          compare_at_cents?: number | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_new?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sold_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          active: boolean
          base_cents: number
          cep_prefix_end: number
          cep_prefix_start: number
          created_at: string
          free_over_cents: number | null
          id: string
          is_demo: boolean
          max_days: number
          min_days: number
          per_item_cents: number
          service: string
        }
        Insert: {
          active?: boolean
          base_cents: number
          cep_prefix_end: number
          cep_prefix_start: number
          created_at?: string
          free_over_cents?: number | null
          id?: string
          is_demo?: boolean
          max_days: number
          min_days: number
          per_item_cents?: number
          service: string
        }
        Update: {
          active?: boolean
          base_cents?: number
          cep_prefix_end?: number
          cep_prefix_start?: number
          created_at?: string
          free_over_cents?: number | null
          id?: string
          is_demo?: boolean
          max_days?: number
          min_days?: number
          per_item_cents?: number
          service?: string
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          occurred_at: string
          order_id: string
          source: string
          status: Database["public"]["Enums"]["order_status"] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          occurred_at?: string
          order_id: string
          source?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          occurred_at?: string
          order_id?: string
          source?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_payment: {
        Args: { _order_id: string; _provider: string; _provider_ref: string }
        Returns: undefined
      }
      create_order: {
        Args: {
          _address: Json
          _items: Json
          _payment_method: Database["public"]["Enums"]["payment_method"]
          _shipping_service: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      quote_shipping: {
        Args: { _cep: string; _items: number; _subtotal_cents: number }
        Returns: {
          is_demo: boolean
          max_days: number
          min_days: number
          price_cents: number
          service: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status:
        | "awaiting_payment"
        | "payment_approved"
        | "preparing"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "canceled"
      payment_method: "pix" | "credit_card" | "debit_card"
      payment_status:
        | "pending"
        | "approved"
        | "refused"
        | "refunded"
        | "canceled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "customer"],
      order_status: [
        "awaiting_payment",
        "payment_approved",
        "preparing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "canceled",
      ],
      payment_method: ["pix", "credit_card", "debit_card"],
      payment_status: [
        "pending",
        "approved",
        "refused",
        "refunded",
        "canceled",
      ],
    },
  },
} as const
