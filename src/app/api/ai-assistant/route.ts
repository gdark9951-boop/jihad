import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // التحقق من وجود API key أولاً
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey || apiKey === "") {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إضافة Google Gemini API Key في ملف .env.local",
          needsApiKey: true,
        },
        { status: 401 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { prompt, action, text } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "النص فارغ. الرجاء تحديد نص أولاً.",
        },
        { status: 400 },
      );
    }

    let fullPrompt = "";

    switch (action) {
      case "improve":
        fullPrompt = `أنت مساعد أكاديمي دقيق. مهمتك هي تحسين النص التالي أكاديمياً ولغوياً.
قاعدة صارمة جداً: ممنوع منعاً باتاً استخدام أي رموز تنسيق مثل النجوم (**) أو الخطوط أو علامات الاقتباس أو الترقيم الزائدة. قدم النص المحسّن فقط كنص صافي (Plain Text) بدون أي زخرفة.

النص:
${text}`;
        break;

      case "rephrase":
        fullPrompt = `أعد صياغة النص التالي بأسلوب أكاديمي محترف.
قاعدة صارمة جداً: قدم النص المعاد صياغته فقط كنص صافي بدون أي رموز تنسيق مثل النجوم أو غيرها. لا تضف أي شرح أو مقدمات.

النص:
${text}`;
        break;

      case "summarize":
        fullPrompt = `لخص النص التالي بشكل موجز.
قاعدة صارمة: ممنوع استخدام أي رموز تنسيق مثل النجوم أو النقاط البرمجية. قدم الملخص كنص صافي فقط.

النص:
${text}`;
        break;

      case "expand":
        fullPrompt = `وسّع الفكرة التالية بشكل أكاديمي.
قاعدة صارمة: ممنوع استخدام أي رموز تنسيق أو نجوم. قدم النص الموسع كنص صافي فقط.

النص:
${text}`;
        break;

      case "grammar":
        fullPrompt = `صحح الأخطاء اللغوية والنحوية في النص التالي.
قاعدة صارمة جداً: ممنوع منعاً باتاً إضافة أي رموز تنسيق أو نجوم أو تنبيهات. قدم النص المصحح فقط كنص صافي.

النص:
${text}`;
        break;

      case "suggest":
        fullPrompt = `اقترح 3 أفكار لتطوير النص التالي في نقاط موجزة جداً.
ممنوع استخدام النجوم أو أي رموز تنسيق.

النص:
${text}`;
        break;

      default:
        fullPrompt = prompt || text;
    }

    // قائمة النماذج المجانية المتاحة لحسابك - تم ترتيبها لتجربة بدائل عند تجاوز الحد
    const MODELS_TO_TRY = [
      "gemini-2.0-flash", 
      "gemini-flash-latest",
      "gemini-2.5-flash", // إضافة النسخة الأحدث كبديل
      "gemini-pro-latest",
      "gemma-3-27b-it", // استخدام Gemma كخيار أخير لأنه غالباً يمتلك حصة منفصلة
    ];

    let result;
    let success = false;
    let lastError = "";

    for (const modelName of MODELS_TO_TRY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(fullPrompt);
        success = true;
        break; 
      } catch (err: any) {
        lastError = err.message || "";
        console.warn(`Failed with ${modelName}:`, lastError);
        
        // استمر في تجربة الموديلات الأخرى حتى لو كان الخطأ "تجاوز الحد" (Quota)
        // لأن كل موديل غالباً ما يمتلك حصة (Quota) منفصلة
        continue;
      }
    }

    if (!success || !result) {
      // إذا كان الخطأ الأخير هو تجاوز الحد، نظهر رسالة واضحة للمستخدم
      if (lastError.includes("quota") || lastError.includes("429")) {
        return NextResponse.json(
          {
            success: false,
            error: "تم تجاوز الحد المجاني لجميع النسخ المتاحة حالياً. يرجى الانتظار دقيقة واحدة والمحاولة مرة أخرى.",
          },
          { status: 429 },
        );
      }
      throw new Error(lastError || "فشلت جميع المحاولات للاتصال بالذكاء الاصطناعي");
    }

    const response = result.response;
    const generatedText = response.text();

    return NextResponse.json({
      success: true,
      text: generatedText,
    });
  } catch (error: any) {
    console.error("AI Error Details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // تحليل نوع الخطأ
    const errorMessage = error.message || "";

    // إذا كان الخطأ متعلق بـ API key
    if (
      errorMessage.includes("API") &&
      (errorMessage.includes("key") || errorMessage.includes("KEY"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "مفتاح API غير صحيح. تأكد من صحة المفتاح في ملف .env.local",
          needsApiKey: true,
        },
        { status: 401 },
      );
    }

    // إذا كان الخطأ متعلق بالحصة
    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("limit") ||
      errorMessage.includes("exhausted")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز الحد المجاني. انتظر قليلاً وحاول مرة أخرى.",
        },
        { status: 429 },
      );
    }

    // أخطاء أخرى
    return NextResponse.json(
      {
        success: false,
        error: `حدث خطأ: ${errorMessage || "خطأ غير معروف"}`,
      },
      { status: 500 },
    );
  }
}
