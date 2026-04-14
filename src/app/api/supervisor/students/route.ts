import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: جلب الطلاب المشرف عليهم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get("supervisorId");

    if (!supervisorId) {
      return NextResponse.json({ error: "معرف المشرف مطلوب" }, { status: 400 });
    }

    // جلب الطلاب المعينين للمشرف
    const { data: assignments, error: assignError } = await supabase
      .from("supervisor_assignments")
      .select(
        `
        id,
        status,
        assigned_at,
        student:users!supervisor_assignments_student_id_fkey (
          id,
          name,
          email
        ),
        research:research_projects (
          id,
          title,
          status,
          word_count,
          updated_at
        )
      `,
      )
      .eq("supervisor_id", supervisorId)
      .eq("status", "active");

    if (assignError) {
      console.error("خطأ في جلب الطلاب:", assignError);
      return NextResponse.json({ error: "فشل جلب الطلاب" }, { status: 500 });
    }

    // جلب إحصائيات التقدم لكل طالب
    const studentsData = await Promise.all(
      (assignments || []).map(async (assignment: any) => {
        const studentId = assignment.student?.id;
        const researchId = assignment.research?.id;

        // جلب الفصول المقدمة
        const { data: chapters, error: chaptersError } = await supabase
          .from("chapter_submissions")
          .select("id, status, chapter_number")
          .eq("student_id", studentId)
          .eq("research_id", researchId);

        // حساب نسبة التقدم
        const totalChapters = chapters?.length || 0;
        const approvedChapters =
          chapters?.filter((c: any) => c.status === "approved").length || 0;
        const pendingReviews =
          chapters?.filter(
            (c: any) => c.status === "pending" || c.status === "under_review",
          ).length || 0;

        // حساب نسبة الإنجاز (افتراض 5 فصول كحد أدنى)
        const expectedChapters = 5;
        const completionPercentage = Math.min(
          Math.round((approvedChapters / expectedChapters) * 100),
          100,
        );

        return {
          assignmentId: assignment.id,
          studentId: studentId,
          studentName: assignment.student?.name || "طالب",
          studentEmail: assignment.student?.email,
          researchId: researchId,
          researchTitle: assignment.research?.title || "لا يوجد بحث بعد",
          researchStatus: assignment.research?.status || "planning",
          wordCount: assignment.research?.word_count || 0,
          lastActivity:
            assignment.research?.updated_at || assignment.assigned_at,
          totalChapters,
          approvedChapters,
          pendingReviews,
          completionPercentage,
          assignedAt: assignment.assigned_at,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      students: studentsData,
      count: studentsData.length,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
