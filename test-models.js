const { GoogleGenerativeAI } = require("@google/generative-ai");
// No dotenv needed

async function listModels() {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No API key found in .env.local");
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const result = await genAI.listModels();
    console.log("Available Models:");
    result.models.forEach(m => {
      console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods})`);
    });
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
