/**
 * Supabase Client Configuration
 * ملف الاتصال بقاعدة البيانات
 */

import { createClient } from "@supabase/supabase-js";

// التحقق من وجود المتغيرات البيئية (بدون تحطيم عملية البناء)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    console.warn("⚠️ Warning: Supabase environment variables are missing during build.");
  }
}

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Supabase Admin Client (للاستخدام في API routes فقط)
// يتجاوز سياسات RLS - استخدمه بحذر!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // fallback to regular client if service key not available

// أنواع البيانات TypeScript
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
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          user_type: "student" | "professor" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          user_type?: "student" | "professor" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          user_type?: "student" | "professor" | "admin";
          updated_at?: string;
        };
      };
      research_projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "planning" | "in_progress" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: "planning" | "in_progress" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: "planning" | "in_progress" | "completed";
          updated_at?: string;
        };
      };
      sources: {
        Row: {
          id: string;
          user_id: string;
          research_id: string | null;
          title: string;
          author: string | null;
          url: string | null;
          type: "book" | "article" | "website" | "other";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          research_id?: string | null;
          title: string;
          author?: string | null;
          url?: string | null;
          type?: "book" | "article" | "website" | "other";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          research_id?: string | null;
          title?: string;
          author?: string | null;
          url?: string | null;
          type?: "book" | "article" | "website" | "other";
          notes?: string | null;
        };
      };
      schedule_tasks: {
        Row: {
          id: string;
          user_id: string;
          research_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          status: "pending" | "in_progress" | "completed";
          priority: "low" | "medium" | "high";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          research_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: "pending" | "in_progress" | "completed";
          priority?: "low" | "medium" | "high";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          research_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: "pending" | "in_progress" | "completed";
          priority?: "low" | "medium" | "high";
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          research_id: string | null;
          message: string;
          response: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          research_id?: string | null;
          message: string;
          response: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          research_id?: string | null;
          message?: string;
          response?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: "info" | "warning" | "success" | "error";
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: "info" | "warning" | "success" | "error";
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: "info" | "warning" | "success" | "error";
          is_read?: boolean;
        };
      };
      user_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          message?: string;
          is_read?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
