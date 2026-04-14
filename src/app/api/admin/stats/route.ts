import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: جلب إحصائيات عامة
export async function GET() {
  try {
    // عدد المستخدمين حسب النوع
    const { data: users } = await supabase.from("users").select("user_type");

    const userStats = {
      students: users?.filter((u) => u.user_type === "student").length || 0,
      professors: users?.filter((u) => u.user_type === "professor").length || 0,
      admins: users?.filter((u) => u.user_type === "admin").length || 0,
      total: users?.length || 0,
    };

    // عدد الأبحاث حسب الحالة
    const { data: projects } = await supabase
      .from("research_projects")
      .select("status, is_published, is_featured");

    const projectStats = {
      planning: projects?.filter((p) => p.status === "planning").length || 0,
      in_progress:
        projects?.filter((p) => p.status === "in_progress").length || 0,
      completed: projects?.filter((p) => p.status === "completed").length || 0,
      published: projects?.filter((p) => p.is_published).length || 0,
      featured: projects?.filter((p) => p.is_featured).length || 0,
      total: projects?.length || 0,
    };

    // عدد التعيينات النشطة
    const { data: assignments } = await supabase
      .from("supervisor_assignments")
      .select("status");

    const assignmentStats = {
      active: assignments?.filter((a) => a.status === "active").length || 0,
      completed:
        assignments?.filter((a) => a.status === "completed").length || 0,
      total: assignments?.length || 0,
    };

    // عدد الفصول حسب الحالة
    const { data: chapters } = await supabase
      .from("chapter_submissions")
      .select("status");

    const chapterStats = {
      pending: chapters?.filter((c) => c.status === "pending").length || 0,
      under_review:
        chapters?.filter((c) => c.status === "under_review").length || 0,
      approved: chapters?.filter((c) => c.status === "approved").length || 0,
      needs_revision:
        chapters?.filter((c) => c.status === "needs_revision").length || 0,
      total: chapters?.length || 0,
    };

    return NextResponse.json({
      success: true,
      stats: {
        users: userStats,
        projects: projectStats,
        assignments: assignmentStats,
        chapters: chapterStats,
      },
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
