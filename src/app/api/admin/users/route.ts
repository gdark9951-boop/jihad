import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: جلب جميع المستخدمين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType"); // student, professor, admin

    let query = supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (userType) {
      query = query.eq("user_type", userType);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("خطأ في جلب المستخدمين:", error);
      return NextResponse.json(
        { error: "فشل جلب المستخدمين", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      count: users?.length || 0,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// POST: إضافة مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, userType, password } = body;

    if (!email || !name || !userType) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 },
      );
    }

    // التحقق من عدم وجود البريد الإلكتروني
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 },
      );
    }

    // إنشاء المستخدم في جدول المستخدمين
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        name,
        user_type: userType,
      })
      .select()
      .single();

    if (insertError) {
      console.error("خطأ في إضافة المستخدم:", insertError);
      return NextResponse.json(
        { error: "فشل إضافة المستخدم" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      message: "تم إضافة المستخدم بنجاح",
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// PUT: تحديث مستخدم
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, userType, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "معرف المستخدم مطلوب" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (userType) updateData.user_type = userType;
    if (typeof isActive === "boolean") updateData.is_active = isActive;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("خطأ في تحديث المستخدم:", error);
      return NextResponse.json(
        { error: "فشل تحديث المستخدم" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "تم تحديث المستخدم بنجاح",
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// DELETE: حذف مستخدم
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "معرف المستخدم مطلوب" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("خطأ في حذف المستخدم:", error);
      return NextResponse.json({ error: "فشل حذف المستخدم" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المستخدم بنجاح",
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
