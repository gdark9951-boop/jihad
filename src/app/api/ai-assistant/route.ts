import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. جمع مفاتيح Gemini
    const geminiKeys = [
      process.env.GOOGLE_GEMINI_API_KEY,
      process.env.GOOGLE_GEMINI_API_KEY_2,
      process.env.GOOGLE_GEMINI_API_KEY_3,
    ].filter((key): key is string => !!key && key !== "");

    // 2. التحقق من مفتاح OpenAI
    const openAIKey = process.env.OPENAI_API_KEY;

    if (geminiKeys.length === 0 && !openAIKey) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إضافة API Key (Gemini أو OpenAI) في إعدادات Render",
          needsApiKey: true,
        },
        { status: 401 },
      );
    }

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

    // قائمة نماذج Gemini المتاحة
    const GEMINI_MODELS = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-2.0-flash-lite",
    ];

    let generatedText = "";
    let success = false;
    let lastError = "";
    let usedProvider = "";
    let usedModel = "";

    // --- المرحلة الأولى: تجربة Gemini (لأنه مجاني) ---
    for (const apiKey of geminiKeys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(apiKey);
      for (const modelName of GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(fullPrompt);
          if (result && result.response) {
            generatedText = result.response.text();
            success = true;
            usedProvider = "Google Gemini";
            usedModel = modelName;
            break;
          }
        } catch (err: any) {
          lastError = err.message || "";
          if (lastError.includes("quota") || lastError.includes("429") || lastError.includes("limit")) continue;
          if (lastError.includes("API_KEY_INVALID")) break;
        }
      }
    }

    // --- المرحلة الثانية: تجربة OpenAI (إذا فشل Gemini وكان المفتاح موجوداً) ---
    if (!success && openAIKey) {
      try {
        console.log("Trying OpenAI fallback...");
        const openai = new OpenAI({ apiKey: openAIKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: fullPrompt }],
          model: "gpt-4o-mini", // نموذج سريع ورخيص
          temperature: 0.7,
        });

        if (completion.choices[0]?.message?.content) {
          generatedText = completion.choices[0].message.content;
          success = true;
          usedProvider = "OpenAI";
          usedModel = "gpt-4o-mini";
        }
      } catch (err: any) {
        lastError = err.message || "";
        console.error("OpenAI Error:", lastError);
      }
    }

    if (!success) {
      if (lastError.includes("quota") || lastError.includes("429")) {
        return NextResponse.json(
          { success: false, error: "تم استهلاك كافة الحصص المجانية والمتاحة. يرجى المحاولة لاحقاً." },
          { status: 429 }
        );
      }
      throw new Error(lastError || "فشلت جميع محاولات الاتصال بالذكاء الاصطناعي");
    }

    return NextResponse.json({
      success: true,
      text: generatedText,
      provider: usedProvider,
      model: usedModel
    });
  } catch (error: any) {
    console.error("AI Error Details:", error);
    return NextResponse.json(
      {
        success: false,
        error: `حدث خطأ: ${error.message || "خطأ غير معروف"}`,
      },
      { status: 500 },
    );
  }
}
