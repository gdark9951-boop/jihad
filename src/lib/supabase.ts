/**
 * Supabase Client Configuration
 * Lazy initialization to prevent build-time crashes on Render/Vercel
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton instances - only created when first used at runtime
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
  }

  _supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
  return _supabase;
}

function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  _supabaseAdmin = serviceKey
    ? createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : getSupabaseClient();

  return _supabaseAdmin;
}

// These are Proxy objects - they look like the real client but only
// initialize the actual connection when a method is first called at runtime.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});


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
