/**
 * Setup Test Accounts
 * إعداد الحسابات الاختبارية
 *
 * استخدام:
 * 1. أضف SUPABASE_SERVICE_KEY إلى .env.local
 * 2. زيارة: http://localhost:3000/api/setup
 * 3. سيتم إنشاء الحسابات الاختبارية
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TEST_ACCOUNTS = [
  {
    email: "student@university.edu",
    password: "123456",
    name: "محمد الطالب",
    user_type: "student",
  },
  {
    email: "prof@university.edu",
    password: "123456",
    name: "د. علي الأستاذ",
    user_type: "professor",
  },
  {
    email: "admin@university.edu",
    password: "123456",
    name: "مدير النظام",
    user_type: "admin",
  },
];

export async function GET() {
  // تحقق من وجود مفتاح الخدمة
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "مفتاح الخدمة غير مكون. الرجاء إضافة SUPABASE_SERVICE_KEY إلى .env.local",
        message:
          "للحصول على المفتاح: Supabase Dashboard → Settings → API → Service role key",
      },
      { status: 500 },
    );
  }

  // إنشاء عميل Supabase مع مفتاح الخدمة (للعمليات الإدارية)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const results = [];

    for (const account of TEST_ACCOUNTS) {
      try {
        // 1. إنشاء المستخدم في Auth
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
            user_metadata: {
              name: account.name,
              user_type: account.user_type,
            },
          });

        if (authError) {
          if (authError.message?.includes("already exists")) {
            results.push({
              email: account.email,
              status: "exists",
              message: "الحساب موجود بالفعل",
            });
          } else {
            throw authError;
          }
        } else if (authData.user) {
          // 2. إنشاء السجل في جدول users
          const { error: insertError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: account.email,
            name: account.name,
            user_type: account.user_type,
          });

          if (insertError && !insertError.message?.includes("duplicate")) {
            console.error(`Insert error for ${account.email}:`, insertError);
          }

          results.push({
            email: account.email,
            status: "created",
            message: "تم إنشاء الحساب بنجاح",
            userId: authData.user.id,
          });
        }
      } catch (error: any) {
        results.push({
          email: account.email,
          status: "error",
          message: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم معالجة إنشاء الحسابات",
      results,
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
