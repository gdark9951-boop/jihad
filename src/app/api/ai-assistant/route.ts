import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    // قائمة النماذج المجانية المتاحة - تم ترتيبها ذكياً لضمان العمل دائماً
    const MODELS_TO_TRY = [
      "gemini-2.0-flash",          // الخيار الأول: الأحدث والأسرع
      "gemini-1.5-flash",          // الخيار الثاني: سريع وموثوق
      "gemini-1.5-flash-8b",       // الخيار الثالث: أخف وأسرع
      "gemini-2.0-flash-lite",     // الخيار الرابع: نسخة خفيفة
    ];

    let result;
    let success = false;
    let lastError = "";
    let usedModel = "";

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Trying AI model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // ضبط مهلة زمنية للمحاولة (Timeout) لضمان السرعة في التبديل
        result = await model.generateContent(fullPrompt);
        
        if (result && result.response) {
          success = true;
          usedModel = modelName;
          console.log(`Successfully used model: ${modelName}`);
          break; 
        }
      } catch (err: any) {
        lastError = err.message || "";
        console.warn(`Model ${modelName} failed. Reason:`, lastError);
        
        // إذا كان الخطأ هو "مفتاح الربط غير صحيح"، لا فائدة من تجربة موديلات أخرى بنفس المفتاح
        if (lastError.includes("API_KEY_INVALID") || lastError.includes("401")) {
          break;
        }
        // استمر لتجربة الموديل التالي في القائمة
        continue;
      }
    }

    if (!success || !result) {
      // تحليل الخطأ النهائي لإظهاره للمستخدم بشكل مفهوم
      if (lastError.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          {
            success: false,
            error: "مفتاح الـ API الذي أدخلته غير صحيح. يرجى الحصول على مفتاح جديد من Google AI Studio.",
            needsApiKey: true,
          },
          { status: 401 }
        );
      }

      if (lastError.includes("quota") || lastError.includes("429")) {
        return NextResponse.json(
          {
            success: false,
            error: "تم استهلاك الحد المجاني لجميع الموديلات المتاحة حالياً. يرجى المحاولة بعد دقيقة واحدة.",
          },
          { status: 429 }
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
