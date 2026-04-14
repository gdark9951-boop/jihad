import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إضافة GOOGLE_GEMINI_API_KEY في إعدادات Render",
          needsApiKey: true,
        },
        { status: 401 },
      );
    }

    const { prompt, action, text } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ success: false, error: "النص فارغ. الرجاء تحديد نص أولاً." }, { status: 400 });
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    try {
      const result = await model.generateContent(fullPrompt);
      const generatedText = result.response.text();

      return NextResponse.json({ 
        success: true, 
        text: generatedText, 
        provider: "Google Gemini", 
        model: "gemini-2.0-flash" 
      });
    } catch (genError: any) {
      console.error("Gemini Error:", genError);
      
      // محاولة بموديل أقدم في حال فشل الجديد
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const fallbackResult = await fallbackModel.generateContent(fullPrompt);
      const fallbackText = fallbackResult.response.text();

      return NextResponse.json({ 
        success: true, 
        text: fallbackText, 
        provider: "Google Gemini", 
        model: "gemini-1.5-flash" 
      });
    }
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "حدث خطأ غير متوقع" 
    }, { status: 500 });
  }
}
