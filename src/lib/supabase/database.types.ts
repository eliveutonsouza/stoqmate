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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_credit_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          from_extra: number | null
          from_plan: number | null
          id: string
          op_id: string | null
          reason: string
          refunded_at: string | null
          tenant_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          from_extra?: number | null
          from_plan?: number | null
          id?: string
          op_id?: string | null
          reason: string
          refunded_at?: string | null
          tenant_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          from_extra?: number | null
          from_plan?: number | null
          id?: string
          op_id?: string | null
          reason?: string
          refunded_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_ops: {
        Row: {
          credits: number
          id: string
          label: string
        }
        Insert: {
          credits: number
          id: string
          label: string
        }
        Update: {
          credits?: number
          id?: string
          label?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          cost_usd: number | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          model: string
          op_id: string
          status: string
          tenant_id: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          op_id: string
          status: string
          tenant_id: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          op_id?: string
          status?: string
          tenant_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ai_ops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          message: string
          scope: string
          target_id: string | null
          target_type: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          message: string
          scope?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          message?: string
          scope?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          created_at: string
          stripe_customer_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          stripe_customer_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          stripe_customer_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_session_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["cash_movement_kind"]
          note: string | null
          reference_id: string | null
          session_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["cash_movement_kind"]
          note?: string | null
          reference_id?: string | null
          session_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["cash_movement_kind"]
          note?: string | null
          reference_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_session_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          counted_amount: number | null
          created_by: string | null
          diff: number | null
          discrepancy_detail: string | null
          discrepancy_reason: string | null
          expected_amount: number | null
          id: string
          opened_at: string
          opening_amount: number
          operator_id: string | null
          status: Database["public"]["Enums"]["cash_session_status"]
          store_id: string
          tenant_id: string
        }
        Insert: {
          closed_at?: string | null
          counted_amount?: number | null
          created_by?: string | null
          diff?: number | null
          discrepancy_detail?: string | null
          discrepancy_reason?: string | null
          expected_amount?: number | null
          id?: string
          opened_at?: string
          opening_amount?: number
          operator_id?: string | null
          status?: Database["public"]["Enums"]["cash_session_status"]
          store_id: string
          tenant_id: string
        }
        Update: {
          closed_at?: string | null
          counted_amount?: number | null
          created_by?: string | null
          diff?: number | null
          discrepancy_detail?: string | null
          discrepancy_reason?: string | null
          expected_amount?: number | null
          id?: string
          opened_at?: string
          opening_amount?: number
          operator_id?: string | null
          status?: Database["public"]["Enums"]["cash_session_status"]
          store_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          code: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          tenant_id: string
          unit: string
          unit_plural: string
        }
        Insert: {
          active?: boolean
          code: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          tenant_id: string
          unit?: string
          unit_plural?: string
        }
        Update: {
          active?: boolean
          code?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          tenant_id?: string
          unit?: string
          unit_plural?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      category_attributes: {
        Row: {
          category_id: string
          id: string
          key: string
          label: string
          position: number
          type: Database["public"]["Enums"]["category_attribute_type"]
          values: string[]
        }
        Insert: {
          category_id: string
          id?: string
          key: string
          label: string
          position?: number
          type?: Database["public"]["Enums"]["category_attribute_type"]
          values?: string[]
        }
        Update: {
          category_id?: string
          id?: string
          key?: string
          label?: string
          position?: number
          type?: Database["public"]["Enums"]["category_attribute_type"]
          values?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_pack_purchases: {
        Row: {
          created_at: string
          credits: number
          id: string
          pack_id: string
          stripe_checkout_session_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          pack_id: string
          stripe_checkout_session_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          pack_id?: string
          stripe_checkout_session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_pack_purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_pack_purchases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          active: boolean
          credits: number
          id: string
          price: number
          stripe_price_id: string | null
        }
        Insert: {
          active?: boolean
          credits: number
          id: string
          price: number
          stripe_price_id?: string | null
        }
        Update: {
          active?: boolean
          credits?: number
          id?: string
          price?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      customer_credit_ledger: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          delta: number
          id: string
          reason: string
          tenant_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          delta: number
          id?: string
          reason: string
          tenant_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delta?: number
          id?: string
          reason?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          anonymized_at: string | null
          created_at: string
          credit_balance: number
          credit_limit: number
          doc: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
        }
        Insert: {
          anonymized_at?: string | null
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          doc?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
        }
        Update: {
          anonymized_at?: string | null
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          doc?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_approvals: {
        Row: {
          approved_by: string
          created_at: string
          expires_at: string
          id: string
          max_pct: number
          sale_id: string | null
          store_id: string
          tenant_id: string
          used_at: string | null
        }
        Insert: {
          approved_by: string
          created_at?: string
          expires_at?: string
          id?: string
          max_pct: number
          sale_id?: string | null
          store_id: string
          tenant_id: string
          used_at?: string | null
        }
        Update: {
          approved_by?: string
          created_at?: string
          expires_at?: string
          id?: string
          max_pct?: number
          sale_id?: string | null
          store_id?: string
          tenant_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_approvals_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_approvals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_approvals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_sessions: {
        Row: {
          ended_at: string | null
          id: string
          reason: string
          staff_user_id: string
          started_at: string
          tenant_id: string
          ticket_ref: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          reason: string
          staff_user_id: string
          started_at?: string
          tenant_id: string
          ticket_ref?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          reason?: string
          staff_user_id?: string
          started_at?: string
          tenant_id?: string
          ticket_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["store_role"]
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["store_role"]
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["store_role"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          period_end: string | null
          status: string
          stripe_invoice_id: string
          tenant_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          period_end?: string | null
          status: string
          stripe_invoice_id: string
          tenant_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          period_end?: string | null
          status?: string
          stripe_invoice_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      location_categories: {
        Row: {
          category_id: string
          location_id: string
        }
        Insert: {
          category_id: string
          location_id: string
        }
        Update: {
          category_id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_categories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          store_id: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          store_id: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          store_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email: boolean
          rule: string
          tenant_id: string
        }
        Insert: {
          email?: boolean
          rule: string
          tenant_id: string
        }
        Update: {
          email?: boolean
          rule?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          email_error: string | null
          emailed_at: string | null
          id: string
          kind: string
          message: string
          read_at: string | null
          store_id: string | null
          target_id: string | null
          target_type: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          email_error?: string | null
          emailed_at?: string | null
          id?: string
          kind: string
          message: string
          read_at?: string | null
          store_id?: string | null
          target_id?: string | null
          target_type?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          email_error?: string | null
          emailed_at?: string | null
          id?: string
          kind?: string
          message?: string
          read_at?: string | null
          store_id?: string | null
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cash_session_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          direction: string
          document_id: string
          document_type: string
          external_ref: string | null
          id: string
          installments: number
          method: Database["public"]["Enums"]["payment_method"]
          provider: string | null
          status: string
          store_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          cash_session_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          direction: string
          document_id: string
          document_type: string
          external_ref?: string | null
          id?: string
          installments?: number
          method: Database["public"]["Enums"]["payment_method"]
          provider?: string | null
          status?: string
          store_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          cash_session_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          direction?: string
          document_id?: string
          document_type?: string
          external_ref?: string | null
          id?: string
          installments?: number
          method?: Database["public"]["Enums"]["payment_method"]
          provider?: string | null
          status?: string
          store_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          features: Json
          id: string
          limits: Json
          monthly_price: number
          name: string
          popular: boolean
          stripe_price_monthly_id: string | null
          stripe_price_yearly_id: string | null
          stripe_product_id: string | null
          tagline: string | null
          who: string | null
          yearly_price: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits?: number
          features?: Json
          id: string
          limits?: Json
          monthly_price: number
          name: string
          popular?: boolean
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          stripe_product_id?: string | null
          tagline?: string | null
          who?: string | null
          yearly_price?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          features?: Json
          id?: string
          limits?: Json
          monthly_price?: number
          name?: string
          popular?: boolean
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          stripe_product_id?: string | null
          tagline?: string | null
          who?: string | null
          yearly_price?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          ai_alert_pct: number
          ai_spend_ceiling_usd: number
          id: boolean
          trial_ai_credits: number
          trial_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_alert_pct?: number
          ai_spend_ceiling_usd?: number
          id?: boolean
          trial_ai_credits?: number
          trial_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_alert_pct?: number
          ai_spend_ceiling_usd?: number
          id?: boolean
          trial_ai_credits?: number
          trial_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_staff: {
        Row: {
          created_at: string
          mfa_required: boolean
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          mfa_required?: boolean
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          mfa_required?: boolean
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          attrs: Json
          barcode: string | null
          brand: string | null
          category_id: string
          cost_price: number
          created_at: string
          default_location_id: string | null
          id: string
          min_stock: number
          name: string
          notes: string | null
          photo_url: string | null
          sale_price: number
          sku: string
          supplier_id: string | null
          tenant_id: string
        }
        Insert: {
          active?: boolean
          attrs?: Json
          barcode?: string | null
          brand?: string | null
          category_id: string
          cost_price?: number
          created_at?: string
          default_location_id?: string | null
          id?: string
          min_stock?: number
          name: string
          notes?: string | null
          photo_url?: string | null
          sale_price?: number
          sku: string
          supplier_id?: string | null
          tenant_id: string
        }
        Update: {
          active?: boolean
          attrs?: Json
          barcode?: string | null
          brand?: string | null
          category_id?: string
          cost_price?: number
          created_at?: string
          default_location_id?: string | null
          id?: string
          min_stock?: number
          name?: string
          notes?: string | null
          photo_url?: string | null
          sale_price?: number
          sku?: string
          supplier_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          initials: string | null
          phone: string | null
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          initials?: string | null
          phone?: string | null
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          initials?: string | null
          phone?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          name: string
          product_id: string | null
          promo_price: number
          scope_type: Database["public"]["Enums"]["promotion_scope"]
          starts_at: string
          tenant_id: string
          until_stock: boolean
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          name: string
          product_id?: string | null
          promo_price: number
          scope_type: Database["public"]["Enums"]["promotion_scope"]
          starts_at?: string
          tenant_id: string
          until_stock?: boolean
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          product_id?: string | null
          promo_price?: number
          scope_type?: Database["public"]["Enums"]["promotion_scope"]
          starts_at?: string
          tenant_id?: string
          until_stock?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "promotions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          qty_ordered: number
          qty_received: number
          unit_cost: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          qty_ordered: number
          qty_received?: number
          unit_cost: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          qty_ordered?: number
          qty_received?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          freight: number
          id: string
          notes: string | null
          received_at: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          store_id: string
          supplier_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          freight?: number
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          store_id: string
          supplier_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          freight?: number
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          store_id?: string
          supplier_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_area_access: {
        Row: {
          access: number
          area: string
          role: Database["public"]["Enums"]["store_role"]
        }
        Insert: {
          access: number
          area: string
          role: Database["public"]["Enums"]["store_role"]
        }
        Update: {
          access?: number
          area?: string
          role?: Database["public"]["Enums"]["store_role"]
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          discount_pct: number
          id: string
          name_snapshot: string
          product_id: string | null
          qty: number
          sale_id: string
          sku_snapshot: string
          total: number
          unit_price: number
          variant_snapshot: string | null
        }
        Insert: {
          discount_pct?: number
          id?: string
          name_snapshot: string
          product_id?: string | null
          qty: number
          sale_id: string
          sku_snapshot: string
          total: number
          unit_price: number
          variant_snapshot?: string | null
        }
        Update: {
          discount_pct?: number
          id?: string
          name_snapshot?: string
          product_id?: string | null
          qty?: number
          sale_id?: string
          sku_snapshot?: string
          total?: number
          unit_price?: number
          variant_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount_amount: number
          id: string
          installments: number
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          salesperson_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          store_id: string
          subtotal: number
          tenant_id: string
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number
          id?: string
          installments?: number
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          salesperson_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          store_id: string
          subtotal: number
          tenant_id: string
          total: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number
          id?: string
          installments?: number
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          salesperson_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          store_id?: string
          subtotal?: number
          tenant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_balances: {
        Row: {
          id: string
          product_id: string
          qty: number
          store_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          qty?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          qty?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_balances_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_items: {
        Row: {
          count_id: string
          counted_qty: number
          id: string
          product_id: string
          system_qty: number
        }
        Insert: {
          count_id: string
          counted_qty: number
          id?: string
          product_id: string
          system_qty: number
        }
        Update: {
          count_id?: string
          counted_qty?: number
          id?: string
          product_id?: string
          system_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          category_id: string | null
          closed_at: string | null
          created_by: string | null
          id: string
          justification: string | null
          location_id: string | null
          opened_at: string
          reason: string | null
          responsible_user_id: string | null
          store_id: string
          tenant_id: string
        }
        Insert: {
          category_id?: string | null
          closed_at?: string | null
          created_by?: string | null
          id?: string
          justification?: string | null
          location_id?: string | null
          opened_at?: string
          reason?: string | null
          responsible_user_id?: string | null
          store_id: string
          tenant_id: string
        }
        Update: {
          category_id?: string | null
          closed_at?: string | null
          created_by?: string | null
          id?: string
          justification?: string | null
          location_id?: string | null
          opened_at?: string
          reason?: string | null
          responsible_user_id?: string | null
          store_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          after_qty: number
          before_qty: number
          created_at: string
          created_by: string | null
          id: string
          justification: string | null
          kind: Database["public"]["Enums"]["movement_kind"]
          product_id: string
          qty: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          store_id: string
          tenant_id: string
          unit_cost: number | null
          unit_price: number | null
        }
        Insert: {
          after_qty: number
          before_qty: number
          created_at?: string
          created_by?: string | null
          id?: string
          justification?: string | null
          kind: Database["public"]["Enums"]["movement_kind"]
          product_id: string
          qty: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          store_id: string
          tenant_id: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          after_qty?: number
          before_qty?: number
          created_at?: string
          created_by?: string | null
          id?: string
          justification?: string | null
          kind?: Database["public"]["Enums"]["movement_kind"]
          product_id?: string
          qty?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          store_id?: string
          tenant_id?: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          id: string
          invited_at: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["store_role"]
          status: Database["public"]["Enums"]["membership_status"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          role: Database["public"]["Enums"]["store_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["store_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: Json | null
          city: string | null
          cnpj: string | null
          created_at: string
          id: string
          name: string
          status: string
          tenant_id: string
          timezone: string
          type: Database["public"]["Enums"]["store_type"]
        }
        Insert: {
          address?: Json | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          tenant_id: string
          timezone?: string
          type?: Database["public"]["Enums"]["store_type"]
        }
        Update: {
          address?: Json | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          timezone?: string
          type?: Database["public"]["Enums"]["store_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          received_at: string
          type: string
        }
        Insert: {
          id: string
          received_at?: string
          type: string
        }
        Update: {
          id?: string
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          cycle: string
          id: string
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          cycle?: string
          id?: string
          plan_id?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          cycle?: string
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_categories: {
        Row: {
          category_id: string
          supplier_id: string
        }
        Insert: {
          category_id: string
          supplier_id: string
        }
        Update: {
          category_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_categories_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: Json | null
          brands: string[]
          cnpj: string | null
          created_at: string
          id: string
          ie: string | null
          lead_time_days: number | null
          min_order_value: number | null
          name: string
          notes: string | null
          order_email: string | null
          payment_terms: string | null
          phone: string | null
          sales_rep: string | null
          tenant_id: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          address?: Json | null
          brands?: string[]
          cnpj?: string | null
          created_at?: string
          id?: string
          ie?: string | null
          lead_time_days?: number | null
          min_order_value?: number | null
          name: string
          notes?: string | null
          order_email?: string | null
          payment_terms?: string | null
          phone?: string | null
          sales_rep?: string | null
          tenant_id: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          address?: Json | null
          brands?: string[]
          cnpj?: string | null
          created_at?: string
          id?: string
          ie?: string | null
          lead_time_days?: number | null
          min_order_value?: number | null
          name?: string
          notes?: string | null
          order_email?: string | null
          payment_terms?: string | null
          phone?: string | null
          sales_rep?: string | null
          tenant_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_lifecycle_events: {
        Row: {
          event_type: string
          from_plan_id: string | null
          id: string
          occurred_at: string
          tenant_id: string
          to_plan_id: string | null
        }
        Insert: {
          event_type: string
          from_plan_id?: string | null
          id?: string
          occurred_at?: string
          tenant_id: string
          to_plan_id?: string | null
        }
        Update: {
          event_type?: string
          from_plan_id?: string | null
          id?: string
          occurred_at?: string
          tenant_id?: string
          to_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_lifecycle_events_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_lifecycle_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_lifecycle_events_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ai_credit_extra_balance: number
          ai_credit_plan_balance: number
          ai_credit_renews_at: string
          brand_color: string | null
          canceled_at: string | null
          cash_control: boolean
          city: string | null
          cnpj: string | null
          created_at: string
          fiscal_mode: string
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          plan_id: string
          segment: string | null
          state: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          trial_ends_at: string
        }
        Insert: {
          ai_credit_extra_balance?: number
          ai_credit_plan_balance?: number
          ai_credit_renews_at?: string
          brand_color?: string | null
          canceled_at?: string | null
          cash_control?: boolean
          city?: string | null
          cnpj?: string | null
          created_at?: string
          fiscal_mode?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          plan_id?: string
          segment?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          trial_ends_at?: string
        }
        Update: {
          ai_credit_extra_balance?: number
          ai_credit_plan_balance?: number
          ai_credit_renews_at?: string
          brand_color?: string | null
          canceled_at?: string | null
          cash_control?: boolean
          city?: string | null
          cnpj?: string | null
          created_at?: string
          fiscal_mode?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          plan_id?: string
          segment?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string
          trial_ends_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_items: {
        Row: {
          id: string
          product_id: string
          qty_received: number | null
          qty_sent: number
          transfer_id: string
        }
        Insert: {
          id?: string
          product_id: string
          qty_received?: number | null
          qty_sent: number
          transfer_id: string
        }
        Update: {
          id?: string
          product_id?: string
          qty_received?: number | null
          qty_sent?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          carrier: string | null
          created_by: string | null
          destination_store_id: string
          discrepancy_detail: string | null
          discrepancy_reason: string | null
          id: string
          notes: string | null
          origin_store_id: string
          reason: string | null
          received_at: string | null
          responsible_user_id: string | null
          shipped_at: string
          status: Database["public"]["Enums"]["transfer_status"]
          tenant_id: string
        }
        Insert: {
          carrier?: string | null
          created_by?: string | null
          destination_store_id: string
          discrepancy_detail?: string | null
          discrepancy_reason?: string | null
          id?: string
          notes?: string | null
          origin_store_id: string
          reason?: string | null
          received_at?: string | null
          responsible_user_id?: string | null
          shipped_at?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          tenant_id: string
        }
        Update: {
          carrier?: string | null
          created_by?: string | null
          destination_store_id?: string
          discrepancy_detail?: string | null
          discrepancy_reason?: string | null
          id?: string
          notes?: string | null
          origin_store_id?: string
          reason?: string | null
          received_at?: string | null
          responsible_user_id?: string | null
          shipped_at?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_destination_store_id_fkey"
            columns: ["destination_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_origin_store_id_fkey"
            columns: ["origin_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_stats: {
        Row: {
          customer_id: string | null
          last_purchase_at: string | null
          purchases_count: number | null
          tenant_id: string | null
          total_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["store_role"]
      }
      auth_tenant_id: { Args: never; Returns: string }
      fn_abc_report: {
        Args: { p_end: string | null; p_start: string | null; p_store_id?: string | null }
        Returns: Json
      }
      fn_accept_invite: {
        Args: { p_full_name: string | null; p_token: string | null }
        Returns: string
      }
      fn_ai_apply_plan_change: {
        Args: { p_plan_id: string | null; p_renews_at?: string | null; p_tenant_id: string | null }
        Returns: undefined
      }
      fn_ai_credit_pack_purchase: {
        Args: {
          p_pack_id: string | null
          p_stripe_checkout_session_id: string | null
          p_tenant_id: string | null
        }
        Returns: undefined
      }
      fn_ai_debit_credits: { Args: { p_op_id: string | null }; Returns: number }
      fn_ai_quota_for: {
        Args: {
          p_plan_id: string | null
          p_status: Database["public"]["Enums"]["tenant_status"] | null
        }
        Returns: number
      }
      fn_ai_refund_credits: { Args: { p_op_id: string | null }; Returns: number }
      fn_ai_refund_credits_for: {
        Args: { p_op_id: string | null; p_tenant_id: string | null }
        Returns: number
      }
      fn_ai_renew_cycle: { Args: never; Returns: number }
      fn_attribute_sales_report: {
        Args: {
          p_category_id: string | null
          p_end: string | null
          p_start: string | null
          p_store_id?: string | null
        }
        Returns: Json
      }
      fn_billing_owner_email: { Args: never; Returns: string }
      fn_bulk_import_products: {
        Args: { p_items: Json | null; p_on_duplicate?: string | null; p_store_id: string | null }
        Returns: Json
      }
      fn_bulk_price_update: {
        Args: {
          p_mode: string | null
          p_pct: number | null
          p_rounding: string | null
          p_scope: string | null
          p_scope_value: string | null
        }
        Returns: Json
      }
      fn_can_see_cost: { Args: never; Returns: boolean }
      fn_cash_session_close: {
        Args: {
          p_counted_amount: number | null
          p_discrepancy_detail?: string | null
          p_discrepancy_reason?: string | null
          p_session_id: string | null
        }
        Returns: undefined
      }
      fn_cash_session_movement: {
        Args: {
          p_amount: number | null
          p_kind: string | null
          p_note: string | null
          p_session_id: string | null
        }
        Returns: string
      }
      fn_cash_session_open: {
        Args: { p_opening_amount: number | null; p_store_id: string | null }
        Returns: string
      }
      fn_claim_notification_emails: {
        Args: { p_limit?: number | null }
        Returns: {
          created_at: string
          id: string
          kind: string
          message: string
          recipients: string[]
          title: string
        }[]
      }
      fn_claim_notification_emails_svc: {
        Args: { p_limit?: number | null }
        Returns: {
          created_at: string
          id: string
          kind: string
          message: string
          recipients: string[]
          title: string
        }[]
      }
      fn_complete_onboarding: {
        Args: {
          p_brand_color: string | null
          p_categories: Json | null
          p_fiscal_mode: string | null
          p_logo_url: string | null
          p_store_name: string | null
        }
        Returns: undefined
      }
      fn_complete_signup: {
        Args: {
          p_cnpj?: string | null
          p_full_name: string | null
          p_plan_id?: string | null
          p_store_name: string | null
          p_subdomain: string | null
        }
        Returns: {
          new_store_id: string
          new_tenant_id: string
        }[]
      }
      fn_confirm_invoice_entry: {
        Args: { p_items: Json | null; p_notes: string | null; p_store_id: string | null }
        Returns: number
      }
      fn_confirm_sale: {
        Args: {
          p_customer_id: string | null
          p_discount_approval_id?: string | null
          p_items: Json | null
          p_notes: string | null
          p_order_discount_amount?: number | null
          p_payments: Json | null
          p_store_id: string | null
        }
        Returns: string
      }
      fn_create_category: {
        Args: { p_attributes: Json | null; p_category: Json | null }
        Returns: string
      }
      fn_create_store: {
        Args: {
          p_city: string | null
          p_cnpj?: string | null
          p_name: string | null
          p_type: string | null
        }
        Returns: string
      }
      fn_create_supplier: {
        Args: { p_category_ids: string[] | null; p_supplier: Json | null }
        Returns: string
      }
      fn_customer_create: {
        Args: {
          p_doc?: string | null
          p_email?: string | null
          p_name: string | null
          p_notes?: string | null
          p_phone?: string | null
        }
        Returns: string
      }
      fn_customer_credit_adjust: {
        Args: { p_customer_id: string | null; p_delta: number | null; p_reason: string | null }
        Returns: number
      }
      fn_customer_credit_apply: {
        Args: {
          p_customer_id: string | null
          p_delta: number | null
          p_reason: string | null
          p_tenant_id: string | null
        }
        Returns: number
      }
      fn_customers_list: {
        Args: {
          p_limit?: number | null
          p_offset?: number | null
          p_term?: string | null
          p_with_credit?: boolean | null
        }
        Returns: Json
      }
      fn_effective_price: {
        Args: { p_product_id: string | null }
        Returns: {
          price: number
          promotion_id: string
          promotion_name: string
        }[]
      }
      fn_effective_prices: {
        Args: { p_product_ids: string[] | null }
        Returns: {
          price: number
          product_id: string
          promotion_name: string
        }[]
      }
      fn_end_impersonation: {
        Args: { p_session_id: string | null }
        Returns: undefined
      }
      fn_grant_discount_approval: {
        Args: { p_max_pct: number | null; p_store_id: string | null }
        Returns: string
      }
      fn_invite_preview: {
        Args: { p_token: string | null }
        Returns: {
          email: string
          role: Database["public"]["Enums"]["store_role"]
          tenant_name: string
        }[]
      }
      fn_like_escape: { Args: { p: string | null }; Returns: string }
      fn_link_billing_customer: {
        Args: { p_stripe_customer_id: string | null }
        Returns: string
      }
      fn_mark_notifications_read: {
        Args: { p_ids?: string[] | null }
        Returns: undefined
      }
      fn_monthly_profit: {
        Args: { p_months?: number | null; p_store_id?: string | null }
        Returns: Json
      }
      fn_movement_costs: {
        Args: { p_movement_ids: string[] | null }
        Returns: {
          movement_id: string
          unit_cost: number
        }[]
      }
      fn_movement_unit_cost: {
        Args: { p_movement_id: string | null }
        Returns: number
      }
      fn_notify_low_stock: {
        Args: {
          p_after_qty: number | null
          p_before_qty: number | null
          p_min_stock: number | null
          p_product_id: string | null
          p_store_id: string | null
          p_tenant_id: string | null
        }
        Returns: undefined
      }
      fn_platform_ai_spend: { Args: { p_since: string | null }; Returns: number }
      fn_platform_cohort_retention: {
        Args: never
        Returns: {
          cohort_month: string
          m0: number
          m1: number
          m2: number
          m3: number
          m4: number
          m5: number
          tenants_count: number
        }[]
      }
      fn_platform_create_tenant: {
        Args: {
          p_city: string | null
          p_cnpj: string | null
          p_legal_name: string | null
          p_name: string | null
          p_owner_full_name: string | null
          p_owner_user_id: string | null
          p_plan_id: string | null
          p_segment: string | null
          p_state: string | null
          p_subdomain: string | null
        }
        Returns: string
      }
      fn_platform_growth_by_month: {
        Args: { p_months?: number | null }
        Returns: {
          canceled_tenants: number
          month: string
          new_tenants: number
        }[]
      }
      fn_platform_mrr_trend: {
        Args: { p_months?: number | null }
        Returns: {
          month: string
          mrr: number
        }[]
      }
      fn_platform_plan_upsert: {
        Args: {
          p_active: boolean | null
          p_credits: number | null
          p_id: string | null
          p_limits: Json | null
          p_monthly_price: number | null
          p_name: string | null
          p_popular: boolean | null
          p_tagline: string | null
          p_who: string | null
          p_yearly_price: number | null
        }
        Returns: undefined
      }
      fn_platform_settings_update: {
        Args: {
          p_ai_alert_pct: number | null
          p_ai_spend_ceiling_usd: number | null
          p_trial_ai_credits: number | null
          p_trial_days: number | null
        }
        Returns: undefined
      }
      fn_platform_tenant_usage: {
        Args: never
        Returns: {
          movements_30d: number
          skus: number
          tenant_id: string
          users: number
        }[]
      }
      fn_platform_trial_days: { Args: never; Returns: number }
      fn_platform_update_tenant: {
        Args: {
          p_city: string | null
          p_cnpj: string | null
          p_legal_name: string | null
          p_name: string | null
          p_plan_id: string | null
          p_segment: string | null
          p_state: string | null
          p_status: string | null
          p_tenant_id: string | null
        }
        Returns: undefined
      }
      fn_product_cost: { Args: { p_product_id: string | null }; Returns: number }
      fn_product_costs: {
        Args: { p_product_ids: string[] | null }
        Returns: {
          cost_price: number
          product_id: string
        }[]
      }
      fn_products_facets: { Args: never; Returns: Json }
      fn_products_list: {
        Args: {
          p_brand?: string | null
          p_category_id?: string | null
          p_limit?: number | null
          p_location_id?: string | null
          p_offset?: number | null
          p_stock?: string | null
          p_term?: string | null
        }
        Returns: Json
      }
      fn_products_sold_since: {
        Args: { p_since: string | null; p_store_id: string | null }
        Returns: string[]
      }
      fn_promotion_create: {
        Args: {
          p_category_id: string | null
          p_ends_at?: string | null
          p_name: string | null
          p_product_id: string | null
          p_promo_price: number | null
          p_scope_type: string | null
          p_starts_at: string | null
          p_until_stock?: boolean | null
        }
        Returns: string
      }
      fn_promotion_set_active: {
        Args: { p_active: boolean | null; p_id: string | null }
        Returns: undefined
      }
      fn_purchase_order_create: {
        Args: {
          p_freight?: number | null
          p_items: Json | null
          p_notes?: string | null
          p_store_id: string | null
          p_supplier_id: string | null
        }
        Returns: string
      }
      fn_purchase_order_receive: {
        Args: { p_items: Json | null; p_order_id: string | null }
        Returns: undefined
      }
      fn_record_notification_email_result: {
        Args: { p_error: string | null; p_id: string | null }
        Returns: undefined
      }
      fn_record_notification_email_result_svc: {
        Args: { p_error: string | null; p_id: string | null; p_retry?: boolean | null }
        Returns: undefined
      }
      fn_register_payments: {
        Args: {
          p_customer_id: string | null
          p_direction: string | null
          p_document_id: string | null
          p_document_type: string | null
          p_expected: number | null
          p_note: string | null
          p_payments: Json | null
          p_store_id: string | null
          p_tenant_id: string | null
        }
        Returns: string
      }
      fn_replenishment_suggestions: {
        Args: { p_store_id: string | null }
        Returns: {
          attrs: Json
          brand: string
          category: Json
          cost_price: number
          cover_days: number
          lead_time_days: number
          min_stock: number
          name: string
          product_id: string
          sku: string
          sold_30d: number
          stock: number
          suggest_qty: number
          supplier_id: string
          supplier_name: string
        }[]
      }
      fn_request_access: { Args: { p_route: string | null }; Returns: undefined }
      fn_request_account_deletion: { Args: never; Returns: undefined }
      fn_sales_report: {
        Args: { p_end: string | null; p_start: string | null; p_store_id?: string | null }
        Returns: Json
      }
      fn_search_products: {
        Args: { p_limit?: number | null; p_term: string | null }
        Returns: {
          attrs: Json
          barcode: string
          brand: string
          category: Json
          cost_price: number
          effective_price: number
          id: string
          min_stock: number
          name: string
          promotion_name: string
          sale_price: number
          sku: string
          stock_balances: Json
        }[]
      }
      fn_session_context: {
        Args: never
        Returns: {
          access: string
          role: Database["public"]["Enums"]["store_role"]
          tenant_id: string
          trial_ends_at: string
        }[]
      }
      fn_set_cash_control: { Args: { p_enabled: boolean | null }; Returns: undefined }
      fn_set_location_categories: {
        Args: { p_category_ids: string[] | null; p_location_id: string | null }
        Returns: undefined
      }
      fn_set_supplier_categories: {
        Args: { p_category_ids: string[] | null; p_supplier_id: string | null }
        Returns: undefined
      }
      fn_shell_counts: { Args: never; Returns: Json }
      fn_start_impersonation: {
        Args: { p_reason: string | null; p_tenant_id: string | null; p_ticket_ref?: string | null }
        Returns: string
      }
      fn_stock_adjustment: {
        Args: {
          p_counted_qty: number | null
          p_justification: string | null
          p_product_id: string | null
          p_reason: string | null
          p_store_id: string | null
        }
        Returns: string
      }
      fn_stock_count_submit: {
        Args: {
          p_category_id: string | null
          p_items: Json | null
          p_justification: string | null
          p_location_id: string | null
          p_reason: string | null
          p_store_id: string | null
        }
        Returns: string
      }
      fn_stock_entry: {
        Args: {
          p_notes?: string | null
          p_product_id: string | null
          p_qty: number | null
          p_store_id: string | null
          p_unit_cost: number | null
        }
        Returns: string
      }
      fn_stock_exchange: {
        Args: {
          p_customer_id?: string | null
          p_delivered_product_id: string | null
          p_notes?: string | null
          p_payments?: Json | null
          p_qty: number | null
          p_reason: string | null
          p_returned_product_id: string | null
          p_store_id: string | null
        }
        Returns: string
      }
      fn_stock_lock: {
        Args: { p_product_id: string | null; p_store_id: string | null }
        Returns: number
      }
      fn_stock_movements_list: {
        Args: {
          p_kind?: string | null
          p_limit?: number | null
          p_offset?: number | null
          p_store_id?: string | null
          p_term?: string | null
        }
        Returns: Json
      }
      fn_stock_overview: { Args: never; Returns: Json }
      fn_stock_return: {
        Args: {
          p_customer_id?: string | null
          p_notes?: string | null
          p_payments?: Json | null
          p_product_id: string | null
          p_qty: number | null
          p_reason: string | null
          p_restock: boolean | null
          p_store_id: string | null
        }
        Returns: string
      }
      fn_store_balance_totals: {
        Args: never
        Returns: {
          qty: number
          sku_count: number
          store_id: string
        }[]
      }
      fn_suppliers_list: {
        Args: {
          p_category_id?: string | null
          p_lead?: string | null
          p_limit?: number | null
          p_offset?: number | null
          p_term?: string | null
        }
        Returns: Json
      }
      fn_team_cancel_invite: {
        Args: { p_invite_id: string | null }
        Returns: undefined
      }
      fn_team_invite: {
        Args: {
          p_email: string | null
          p_full_name: string | null
          p_role: Database["public"]["Enums"]["store_role"] | null
        }
        Returns: string
      }
      fn_team_members: {
        Args: never
        Returns: {
          email: string
          full_name: string
          initials: string
          joined_at: string
          last_sign_in_at: string
          role: Database["public"]["Enums"]["store_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }[]
      }
      fn_team_pending_invites: {
        Args: never
        Returns: {
          email: string
          expires_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["store_role"]
          token: string
        }[]
      }
      fn_team_remove: { Args: { p_user_id: string | null }; Returns: undefined }
      fn_team_set_role: {
        Args: {
          p_role: Database["public"]["Enums"]["store_role"] | null
          p_user_id: string | null
        }
        Returns: undefined
      }
      fn_tenant_has_feature: { Args: { p_key: string | null }; Returns: boolean }
      fn_transfer_dispatch: {
        Args: {
          p_carrier?: string | null
          p_destination_store_id: string | null
          p_items: Json | null
          p_notes?: string | null
          p_origin_store_id: string | null
          p_reason: string | null
        }
        Returns: string
      }
      fn_transfer_receive: {
        Args: {
          p_discrepancy_detail?: string | null
          p_discrepancy_reason?: string | null
          p_items: Json | null
          p_transfer_id: string | null
        }
        Returns: undefined
      }
      fn_update_branding: {
        Args: { p_brand_color: string | null; p_logo_url: string | null }
        Returns: undefined
      }
      fn_update_company_data: {
        Args: { p_cnpj: string | null; p_name: string | null }
        Returns: undefined
      }
      fn_update_fiscal_mode: { Args: { p_mode: string | null }; Returns: undefined }
      fn_write_ai_usage: {
        Args: {
          p_cost_usd: number | null
          p_error_message?: string | null
          p_latency_ms?: number | null
          p_model: string | null
          p_op_id: string | null
          p_status: string | null
          p_tokens_in: number | null
          p_tokens_out: number | null
        }
        Returns: undefined
      }
      fn_write_ai_usage_for: {
        Args: {
          p_cost_usd: number | null
          p_error_message?: string | null
          p_latency_ms?: number | null
          p_model: string | null
          p_op_id: string | null
          p_status: string | null
          p_tenant_id: string | null
          p_tokens_in: number | null
          p_tokens_out: number | null
          p_user_id: string | null
        }
        Returns: undefined
      }
      fn_write_audit: {
        Args: {
          p_kind: string | null
          p_message: string | null
          p_target_id?: string | null
          p_target_type?: string | null
        }
        Returns: undefined
      }
      fn_customer_update: {
        Args: {
          p_customer_id: string | null
          p_doc?: string | null
          p_email?: string | null
          p_name: string | null
          p_notes?: string | null
          p_phone?: string | null
        }
        Returns: undefined
      }
      fn_customer_anonymize: { Args: { p_customer_id: string | null }; Returns: undefined }
      fn_write_audit_app: {
        Args: {
          p_kind: string | null
          p_message: string | null
          p_target_id?: string | null
          p_target_type?: string | null
        }
        Returns: undefined
      }
      fn_rate_limit_hit: {
        Args: {
          p_key: string | null
          p_max: number | null
          p_window_seconds: number | null
        }
        Returns: boolean
      }
      mfa_satisfied: { Args: never; Returns: boolean }
      has_access: {
        Args: { p_area: string | null; p_min_level?: number | null }
        Returns: boolean
      }
      has_platform_role: {
        Args: { p_roles: Database["public"]["Enums"]["platform_role"][] | null }
        Returns: boolean
      }
      is_platform_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      cash_movement_kind: "open" | "supply" | "withdraw" | "sale" | "refund"
      cash_session_status: "open" | "closed"
      category_attribute_type: "color" | "size" | "spec"
      membership_status: "active" | "invited"
      movement_kind:
        | "sale"
        | "entry"
        | "return"
        | "exchange"
        | "transfer"
        | "adjustment"
        | "count"
      payment_method:
        | "dinheiro"
        | "pix"
        | "debito"
        | "credito"
        | "crediario"
        | "dividido"
        | "credito_loja"
        | "outro"
      platform_role: "super_admin" | "suporte" | "engenharia" | "comercial"
      promotion_scope: "product" | "category" | "store"
      purchase_order_status: "sent" | "received"
      sale_status: "completed" | "voided"
      store_role: "vendedor" | "estoquista" | "financeiro" | "proprietario"
      store_type: "loja" | "cd" | "quiosque" | "estoque_externo"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
        | "paused"
      tenant_status: "trial" | "active" | "past_due" | "canceled"
      transfer_status: "dispatched" | "received" | "discrepancy"
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
      cash_movement_kind: ["open", "supply", "withdraw", "sale", "refund"],
      cash_session_status: ["open", "closed"],
      category_attribute_type: ["color", "size", "spec"],
      membership_status: ["active", "invited"],
      movement_kind: [
        "sale",
        "entry",
        "return",
        "exchange",
        "transfer",
        "adjustment",
        "count",
      ],
      payment_method: [
        "dinheiro",
        "pix",
        "debito",
        "credito",
        "crediario",
        "dividido",
        "credito_loja",
        "outro",
      ],
      platform_role: ["super_admin", "suporte", "engenharia", "comercial"],
      promotion_scope: ["product", "category", "store"],
      purchase_order_status: ["sent", "received"],
      sale_status: ["completed", "voided"],
      store_role: ["vendedor", "estoquista", "financeiro", "proprietario"],
      store_type: ["loja", "cd", "quiosque", "estoque_externo"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
        "paused",
      ],
      tenant_status: ["trial", "active", "past_due", "canceled"],
      transfer_status: ["dispatched", "received", "discrepancy"],
    },
  },
} as const
