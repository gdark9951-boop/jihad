import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST: ترشيح بحث للنشر أو جعله مميزاً
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      researchId,
      isPublished,
      isFeatured,
      supervisorId,
      supervisorName,
      graduationYear,
      summary,
    } = body;

    if (!researchId) {
      return NextResponse.json({ error: "معرف البحث مطلوب" }, { status: 400 });
    }

    // التحقق من وجود البحث والصلاحيات
    const { data: research, error: fetchError } = await supabase
      .from("research_projects")
      .select("*, users!research_projects_user_id_fkey(name)")
      .eq("id", researchId)
      .single();

    if (fetchError || !research) {
      return NextResponse.json({ error: "البحث غير موجود" }, { status: 404 });
    }

    // التحقق من أن البحث مكتمل
    if (research.status !== "completed") {
      return NextResponse.json(
        { error: "يجب أن يكون البحث مكتملاً قبل النشر" },
        { status: 400 },
      );
    }

    // تحديث بيانات البحث
    const updateData: any = {};

    if (typeof isPublished === "boolean") {
      updateData.is_published = isPublished;
      if (isPublished) {
        updateData.published_at = new Date().toISOString();
      } else {
        updateData.published_at = null;
      }
    }

    if (typeof isFeatured === "boolean") {
      updateData.is_featured = isFeatured;
    }

    if (supervisorId) {
      updateData.supervisor_id = supervisorId;
    }

    if (supervisorName) {
      updateData.supervisor_name = supervisorName;
    }

    if (graduationYear) {
      updateData.graduation_year = graduationYear;
    }

    if (summary) {
      updateData.summary = summary;
    }

    const { data: updatedResearch, error: updateError } = await supabase
      .from("research_projects")
      .update(updateData)
      .eq("id", researchId)
      .select()
      .single();

    if (updateError) {
      console.error("خطأ في تحديث البحث:", updateError);
      return NextResponse.json({ error: "فشل تحديث البحث" }, { status: 500 });
    }

    // إنشاء إشعار للطالب
    if (isPublished) {
      await supabase.from("notifications").insert({
        user_id: research.user_id,
        title: isFeatured ? "🌟 بحثك تم ترشيحه كبحث مميز!" : "✅ تم نشر بحثك",
        message: isFeatured
          ? `تهانينا! تم ترشيح بحثك "${research.title}" كبحث مميز في معرض مداد. هذا إنجاز رائع!`
          : `تم نشر بحثك "${research.title}" في معرض مداد. الآن يمكن للطلاب الآخرين الاستفادة منه.`,
        type: "success",
      });
    }

    return NextResponse.json({
      success: true,
      message: isPublished
        ? isFeatured
          ? "تم ترشيح البحث كبحث مميز ونشره بنجاح"
          : "تم نشر البحث بنجاح"
        : "تم إلغاء نشر البحث",
      research: updatedResearch,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// GET: جلب الأبحاث المكتملة للمشرف
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get("supervisorId");

    let query = supabase
      .from("research_projects")
      .select(
        `
        id,
        title,
        description,
        summary,
        word_count,
        status,
        is_published,
        is_featured,
        published_at,
        graduation_year,
        supervisor_name,
        created_at,
        updated_at,
        users!research_projects_user_id_fkey (
          id,
          name,
          email
        )
      `,
      )
      .eq("status", "completed")
      .order("updated_at", { ascending: false });

    // إذا كان المشرف محدداً، جلب أبحاثه فقط
    if (supervisorId) {
      query = query.eq("supervisor_id", supervisorId);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("خطأ في جلب الأبحاث:", error);
      return NextResponse.json({ error: "فشل جلب الأبحاث" }, { status: 500 });
    }

    const formattedProjects =
      projects?.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        summary: project.summary,
        wordCount: project.word_count,
        status: project.status,
        isPublished: project.is_published,
        isFeatured: project.is_featured,
        publishedAt: project.published_at,
        graduationYear: project.graduation_year,
        supervisorName: project.supervisor_name,
        studentName: project.users?.name || "طالب",
        studentId: project.users?.id,
        studentEmail: project.users?.email,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })) || [];

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      count: formattedProjects.length,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
