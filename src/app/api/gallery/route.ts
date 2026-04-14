import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: جلب الأبحاث المنشورة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured"); // لجلب الأبحاث المميزة فقط
    const year = searchParams.get("year"); // التصفية حسب السنة

    let query = supabase
      .from("research_projects")
      .select(
        `
        id,
        title,
        description,
        summary,
        word_count,
        graduation_year,
        published_at,
        is_featured,
        supervisor_name,
        user_id,
        users!research_projects_user_id_fkey (
          id,
          name,
          email
        )
      `,
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    // تصفية الأبحاث المميزة
    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    // تصفية حسب السنة
    if (year) {
      query = query.eq("graduation_year", parseInt(year));
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("خطأ في جلب الأبحاث:", error);
      return NextResponse.json(
        { error: "فشل جلب الأبحاث المنشورة" },
        { status: 500 },
      );
    }

    // تنسيق البيانات
    const formattedProjects =
      projects?.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        summary: project.summary || project.description,
        wordCount: project.word_count,
        graduationYear: project.graduation_year,
        publishedAt: project.published_at,
        isFeatured: project.is_featured,
        supervisorName: project.supervisor_name,
        studentName: project.users?.name || "طالب",
        studentEmail: project.users?.email || "",
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
