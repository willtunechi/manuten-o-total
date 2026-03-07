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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      asset_stop_records: {
        Row: {
          asset_id: string
          asset_kind: string
          description: string | null
          id: string
          maintenance_type: string | null
          reason: string | null
          resumed_at: string | null
          stopped_at: string
        }
        Insert: {
          asset_id: string
          asset_kind?: string
          description?: string | null
          id?: string
          maintenance_type?: string | null
          reason?: string | null
          resumed_at?: string | null
          stopped_at?: string
        }
        Update: {
          asset_id?: string
          asset_kind?: string
          description?: string | null
          id?: string
          maintenance_type?: string | null
          reason?: string | null
          resumed_at?: string | null
          stopped_at?: string
        }
        Relationships: []
      }
      component_rules: {
        Row: {
          apply_mode: string
          created_at: string
          id: string
          machine_type: string
          model: string | null
          name: string
          tag: string
          type: string
        }
        Insert: {
          apply_mode?: string
          created_at?: string
          id?: string
          machine_type: string
          model?: string | null
          name: string
          tag: string
          type: string
        }
        Update: {
          apply_mode?: string
          created_at?: string
          id?: string
          machine_type?: string
          model?: string | null
          name?: string
          tag?: string
          type?: string
        }
        Relationships: []
      }
      components: {
        Row: {
          id: string
          machine_id: string | null
          machine_type: string
          model: string | null
          name: string
          rule_id: string | null
          sector: string | null
          status: string
          tag: string
          type: string
        }
        Insert: {
          id?: string
          machine_id?: string | null
          machine_type?: string
          model?: string | null
          name: string
          rule_id?: string | null
          sector?: string | null
          status?: string
          tag: string
          type?: string
        }
        Update: {
          id?: string
          machine_id?: string | null
          machine_type?: string
          model?: string | null
          name?: string
          rule_id?: string | null
          sector?: string | null
          status?: string
          tag?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      failures: {
        Row: {
          common_parts: string[] | null
          component_id: string | null
          id: string
          machine_id: string | null
          probable_cause: string | null
          recommended_action: string | null
          symptom: string | null
        }
        Insert: {
          common_parts?: string[] | null
          component_id?: string | null
          id?: string
          machine_id?: string | null
          probable_cause?: string | null
          recommended_action?: string | null
          symptom?: string | null
        }
        Update: {
          common_parts?: string[] | null
          component_id?: string | null
          id?: string
          machine_id?: string | null
          probable_cause?: string | null
          recommended_action?: string | null
          symptom?: string | null
        }
        Relationships: []
      }
      inventory_counts: {
        Row: {
          counted_by: string
          counted_quantity: number
          difference: number
          expected_quantity: number
          id: string
          notes: string | null
          part_id: string
          registered_at: string
        }
        Insert: {
          counted_by?: string
          counted_quantity?: number
          difference?: number
          expected_quantity?: number
          id?: string
          notes?: string | null
          part_id: string
          registered_at?: string
        }
        Update: {
          counted_by?: string
          counted_quantity?: number
          difference?: number
          expected_quantity?: number
          id?: string
          notes?: string | null
          part_id?: string
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      lines: {
        Row: {
          active: boolean
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          active?: boolean
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      lubrication_executions: {
        Row: {
          executed_at: string
          id: string
          manually_adjusted: boolean
          next_due_date_after: string | null
          notes: string | null
          plan_id: string
          previous_due_date: string | null
        }
        Insert: {
          executed_at?: string
          id?: string
          manually_adjusted?: boolean
          next_due_date_after?: string | null
          notes?: string | null
          plan_id: string
          previous_due_date?: string | null
        }
        Update: {
          executed_at?: string
          id?: string
          manually_adjusted?: boolean
          next_due_date_after?: string | null
          notes?: string | null
          plan_id?: string
          previous_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lubrication_executions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lubrication_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lubrication_plans: {
        Row: {
          active: boolean
          asset_id: string
          asset_kind: string
          asset_name: string
          asset_tag: string
          attention_points: string
          frequency_days: number
          id: string
          last_execution_at: string | null
          line: string
          lubricant_type: string
          machine_type: string
          next_due_date: string | null
          what_to_lubricate: string
        }
        Insert: {
          active?: boolean
          asset_id: string
          asset_kind?: string
          asset_name?: string
          asset_tag?: string
          attention_points?: string
          frequency_days?: number
          id?: string
          last_execution_at?: string | null
          line?: string
          lubricant_type?: string
          machine_type?: string
          next_due_date?: string | null
          what_to_lubricate?: string
        }
        Update: {
          active?: boolean
          asset_id?: string
          asset_kind?: string
          asset_name?: string
          asset_tag?: string
          attention_points?: string
          frequency_days?: number
          id?: string
          last_execution_at?: string | null
          line?: string
          lubricant_type?: string
          machine_type?: string
          next_due_date?: string | null
          what_to_lubricate?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          horimeter: number
          id: string
          manufacturer: string
          model: string
          sector: string
          status: string
          tag: string
          type: string
          year: number
        }
        Insert: {
          horimeter?: number
          id?: string
          manufacturer?: string
          model?: string
          sector?: string
          status?: string
          tag: string
          type?: string
          year?: number
        }
        Update: {
          horimeter?: number
          id?: string
          manufacturer?: string
          model?: string
          sector?: string
          status?: string
          tag?: string
          type?: string
          year?: number
        }
        Relationships: []
      }
      maintenance_plan_items: {
        Row: {
          attention_points: string
          description: string
          frequency_days: number
          id: string
          inspection_type: string
          observation: string
          plan_id: string
          responsible: string
        }
        Insert: {
          attention_points?: string
          description?: string
          frequency_days?: number
          id?: string
          inspection_type?: string
          observation?: string
          plan_id: string
          responsible?: string
        }
        Update: {
          attention_points?: string
          description?: string
          frequency_days?: number
          id?: string
          inspection_type?: string
          observation?: string
          plan_id?: string
          responsible?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "maintenance_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_plans: {
        Row: {
          active: boolean
          id: string
          machine_ids: string[] | null
          machine_type: string
          name: string
          plan_type: string
        }
        Insert: {
          active?: boolean
          id?: string
          machine_ids?: string[] | null
          machine_type?: string
          name: string
          plan_type?: string
        }
        Update: {
          active?: boolean
          id?: string
          machine_ids?: string[] | null
          machine_type?: string
          name?: string
          plan_type?: string
        }
        Relationships: []
      }
      mechanic_components: {
        Row: {
          component_id: string
          id: string
          mechanic_id: string
        }
        Insert: {
          component_id: string
          id?: string
          mechanic_id: string
        }
        Update: {
          component_id?: string
          id?: string
          mechanic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_components_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_machines: {
        Row: {
          id: string
          machine_id: string
          mechanic_id: string
        }
        Insert: {
          id?: string
          machine_id: string
          mechanic_id: string
        }
        Update: {
          id?: string
          machine_id?: string
          mechanic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_machines_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_machines_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          available: boolean
          can_execute_checklist: boolean
          can_execute_preventive: boolean
          email: string | null
          id: string
          level: string
          name: string
          role: string
          shift: string
        }
        Insert: {
          available?: boolean
          can_execute_checklist?: boolean
          can_execute_preventive?: boolean
          email?: string | null
          id?: string
          level?: string
          name: string
          role?: string
          shift?: string
        }
        Update: {
          available?: boolean
          can_execute_checklist?: boolean
          can_execute_preventive?: boolean
          email?: string | null
          id?: string
          level?: string
          name?: string
          role?: string
          shift?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          description: string | null
          id: string
          location: string
          min_stock: number
          quantity: number
          sku: string | null
          supplier: string | null
          unit: string | null
          unit_cost: number
        }
        Insert: {
          description?: string | null
          id?: string
          location?: string
          min_stock?: number
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string | null
          unit_cost?: number
        }
        Update: {
          description?: string | null
          id?: string
          location?: string
          min_stock?: number
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string | null
          unit_cost?: number
        }
        Relationships: []
      }
      plan_executions: {
        Row: {
          completed_at: string | null
          id: string
          machine_id: string | null
          plan_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          machine_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          machine_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_executions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_executions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "maintenance_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_item_results: {
        Row: {
          comment: string | null
          completed: boolean
          completed_at: string | null
          execution_id: string
          id: string
          item_id: string
          mechanic_id: string | null
          photo_url: string | null
          result: string | null
        }
        Insert: {
          comment?: string | null
          completed?: boolean
          completed_at?: string | null
          execution_id: string
          id?: string
          item_id: string
          mechanic_id?: string | null
          photo_url?: string | null
          result?: string | null
        }
        Update: {
          comment?: string | null
          completed?: boolean
          completed_at?: string | null
          execution_id?: string
          id?: string
          item_id?: string
          mechanic_id?: string | null
          photo_url?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_item_results_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "plan_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          part_description: string
          part_id: string | null
          quantity: number
          status: string
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          part_description?: string
          part_id?: string | null
          quantity?: number
          status?: string
          supplier?: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          part_description?: string
          part_id?: string | null
          quantity?: number
          status?: string
          supplier?: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entries: {
        Row: {
          entry_date: string
          id: string
          invoice_number: string | null
          invoice_xml: string | null
          nfe_access_key: string | null
          notes: string | null
          part_id: string
          purchase_order_id: string | null
          quantity: number
        }
        Insert: {
          entry_date?: string
          id?: string
          invoice_number?: string | null
          invoice_xml?: string | null
          nfe_access_key?: string | null
          notes?: string | null
          part_id: string
          purchase_order_id?: string | null
          quantity?: number
        }
        Update: {
          entry_date?: string
          id?: string
          invoice_number?: string | null
          invoice_xml?: string | null
          nfe_access_key?: string | null
          notes?: string | null
          part_id?: string
          purchase_order_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entries_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_parts_used: {
        Row: {
          id: string
          part_id: string
          quantity: number
          ticket_id: string
        }
        Insert: {
          id?: string
          part_id: string
          quantity?: number
          ticket_id: string
        }
        Update: {
          id?: string
          part_id?: string
          quantity?: number
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          machine_id: string
          maintenance_type: string | null
          photo_url: string | null
          priority: string
          reported_by: string | null
          resolved_at: string | null
          status: string
          symptom: string
          type: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          machine_id: string
          maintenance_type?: string | null
          photo_url?: string | null
          priority?: string
          reported_by?: string | null
          resolved_at?: string | null
          status?: string
          symptom?: string
          type?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          machine_id?: string
          maintenance_type?: string | null
          photo_url?: string | null
          priority?: string
          reported_by?: string | null
          resolved_at?: string | null
          status?: string
          symptom?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          must_change_password: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          must_change_password?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_hours: number | null
          asset_id: string
          asset_kind: string
          description: string
          finished_at: string | null
          id: string
          opened_at: string
          planned_hours: number
          reopened: boolean
          started_at: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          actual_hours?: number | null
          asset_id: string
          asset_kind?: string
          description?: string
          finished_at?: string | null
          id?: string
          opened_at?: string
          planned_hours?: number
          reopened?: boolean
          started_at?: string | null
          status?: string
          title?: string
          type?: string
        }
        Update: {
          actual_hours?: number | null
          asset_id?: string
          asset_kind?: string
          description?: string
          finished_at?: string | null
          id?: string
          opened_at?: string
          planned_hours?: number
          reopened?: boolean
          started_at?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_must_change_password: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "mechanic"
        | "operator"
        | "logistica"
        | "supervisor_manutencao"
        | "supervisor_operacoes"
        | "supervisor_logistica"
      asset_kind: "machine" | "component"
      component_apply_mode: "current" | "current_and_future"
      component_type: "trocador_calor" | "bomba_vacuo" | "tanque_agua"
      item_result_type: "ok" | "nok"
      machine_status:
        | "operating"
        | "stopped"
        | "maintenance"
        | "waiting"
        | "scheduled"
      machine_type:
        | "extrusora"
        | "misturador"
        | "bomba_vacuo"
        | "trocador_calor"
        | "tanque_agua"
      maintenance_type: "mechanical" | "electrical"
      mechanic_level: "junior" | "mid" | "senior"
      mechanic_role:
        | "mechanic"
        | "operator"
        | "logistica"
        | "supervisor_manutencao"
        | "supervisor_operacoes"
        | "supervisor_logistica"
      os_type: "corrective" | "inspection"
      plan_execution_status: "in_progress" | "completed"
      plan_type: "preventive" | "checklist"
      priority_level: "critical" | "high" | "medium" | "low"
      purchase_status:
        | "searching_suppliers"
        | "quoting"
        | "ordered"
        | "awaiting_delivery"
        | "received"
      responsible_type: "operador" | "manutencao"
      stop_reason:
        | "checklist"
        | "preventive"
        | "corrective"
        | "lubrication"
        | "other"
      ticket_status: "pending" | "in_maintenance" | "resolved"
      work_order_status: "open" | "in_progress" | "completed"
      work_order_type: "planned" | "unplanned"
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
        "mechanic",
        "operator",
        "logistica",
        "supervisor_manutencao",
        "supervisor_operacoes",
        "supervisor_logistica",
      ],
      asset_kind: ["machine", "component"],
      component_apply_mode: ["current", "current_and_future"],
      component_type: ["trocador_calor", "bomba_vacuo", "tanque_agua"],
      item_result_type: ["ok", "nok"],
      machine_status: [
        "operating",
        "stopped",
        "maintenance",
        "waiting",
        "scheduled",
      ],
      machine_type: [
        "extrusora",
        "misturador",
        "bomba_vacuo",
        "trocador_calor",
        "tanque_agua",
      ],
      maintenance_type: ["mechanical", "electrical"],
      mechanic_level: ["junior", "mid", "senior"],
      mechanic_role: [
        "mechanic",
        "operator",
        "logistica",
        "supervisor_manutencao",
        "supervisor_operacoes",
        "supervisor_logistica",
      ],
      os_type: ["corrective", "inspection"],
      plan_execution_status: ["in_progress", "completed"],
      plan_type: ["preventive", "checklist"],
      priority_level: ["critical", "high", "medium", "low"],
      purchase_status: [
        "searching_suppliers",
        "quoting",
        "ordered",
        "awaiting_delivery",
        "received",
      ],
      responsible_type: ["operador", "manutencao"],
      stop_reason: [
        "checklist",
        "preventive",
        "corrective",
        "lubrication",
        "other",
      ],
      ticket_status: ["pending", "in_maintenance", "resolved"],
      work_order_status: ["open", "in_progress", "completed"],
      work_order_type: ["planned", "unplanned"],
    },
  },
} as const
