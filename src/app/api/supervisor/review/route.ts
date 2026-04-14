import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: جلب الفصول المقدمة للمراجعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get("supervisorId");
    const status = searchParams.get("status"); // pending, under_review, approved, needs_revision

    if (!supervisorId) {
      return NextResponse.json({ error: "معرف المشرف مطلوب" }, { status: 400 });
    }

    // جلب معرفات الطلاب المشرف عليهم
    const { data: assignments } = await supabase
      .from("supervisor_assignments")
      .select("student_id")
      .eq("supervisor_id", supervisorId);

    const studentIds = assignments?.map((a: any) => a.student_id) || [];

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        chapters: [],
        count: 0,
      });
    }

    // جلب الفصول من الطلاب الذين يشرف عليهم
    let query = supabase
      .from("chapter_submissions")
      .select(
        `
        *,
        student:users!chapter_submissions_student_id_fkey (
          id,
          name,
          email
        ),
        research:research_projects (
          id,
          title
        ),
        comments:review_comments (
          id,
          comment,
          type,
          is_resolved,
          created_at
        )
      `,
      )
      .in("student_id", studentIds)
      .order("submitted_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: chapters, error } = await query;

    if (error) {
      console.error("خطأ في جلب الفصول:", error);
      return NextResponse.json({ error: "فشل جلب الفصول" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chapters: chapters || [],
      count: chapters?.length || 0,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// POST: إضافة تعليق على فصل
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chapterId,
      reviewerId,
      comment,
      type = "general",
      positionStart,
      positionEnd,
    } = body;

    if (!chapterId || !reviewerId || !comment) {
      return NextResponse.json(
        { error: "البيانات المطلوبة غير مكتملة" },
        { status: 400 },
      );
    }

    // إضافة التعليق
    const { data: newComment, error } = await supabase
      .from("review_comments")
      .insert({
        chapter_id: chapterId,
        reviewer_id: reviewerId,
        comment,
        type,
        position_start: positionStart,
        position_end: positionEnd,
      })
      .select()
      .single();

    if (error) {
      console.error("خطأ في إضافة التعليق:", error);
      return NextResponse.json({ error: "فشل إضافة التعليق" }, { status: 500 });
    }

    // تحديث حالة الفصل إلى "تحت المراجعة"
    await supabase
      .from("chapter_submissions")
      .update({ status: "under_review", reviewed_at: new Date().toISOString() })
      .eq("id", chapterId);

    // إرسال إشعار للطالب
    const { data: chapter } = await supabase
      .from("chapter_submissions")
      .select("student_id, title")
      .eq("id", chapterId)
      .single();

    if (chapter) {
      await supabase.from("notifications").insert({
        user_id: chapter.student_id,
        title: "💬 تعليق جديد من المشرف",
        message: `تم إضافة تعليق جديد على الفصل "${chapter.title}"`,
        type: "info",
      });
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// PUT: تحديث حالة الفصل (اعتماد أو رفض)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId, status, reviewerId } = body;

    if (!chapterId || !status) {
      return NextResponse.json(
        { error: "البيانات المطلوبة غير مكتملة" },
        { status: 400 },
      );
    }

    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updatedChapter, error } = await supabase
      .from("chapter_submissions")
      .update(updateData)
      .eq("id", chapterId)
      .select("*, student:users!chapter_submissions_student_id_fkey(id, name)")
      .single();

    if (error) {
      console.error("خطأ في تحديث حالة الفصل:", error);
      return NextResponse.json(
        { error: "فشل تحديث حالة الفصل" },
        { status: 500 },
      );
    }

    // إرسال إشعار للطالب
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType: "success" | "warning" | "info" = "info";

    if (status === "approved") {
      notificationTitle = "✅ تم اعتماد الفصل";
      notificationMessage = `تم اعتماد الفصل "${updatedChapter.title}" من قبل المشرف`;
      notificationType = "success";
    } else if (status === "needs_revision") {
      notificationTitle = "⚠️ الفصل يحتاج تعديل";
      notificationMessage = `الفصل "${updatedChapter.title}" يحتاج إلى تعديلات. يرجى مراجعة التعليقات`;
      notificationType = "warning";
    }

    if (updatedChapter.student?.id) {
      await supabase.from("notifications").insert({
        user_id: updatedChapter.student.id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
      });
    }

    return NextResponse.json({
      success: true,
      chapter: updatedChapter,
    });
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
