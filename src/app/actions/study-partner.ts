'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeRecall(params: {
  chapterTitle: string;
  bookTitle: string;
  keyPoints: { text: string; id: string }[];
  transcript: string;
}) {
  if (!params.transcript || params.transcript.trim().length < 5) {
    return {
      coveredPointIds: [],
      feedback: "I didn't hear enough to give a summary.",
      clue: "Try speaking a bit more about the chapter so I can track your progress."
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      coveredPointIds: [],
      feedback: "API Key Missing",
      clue: "Please ensure the GEMINI_API_KEY is set in your environment variables."
    };
  }

  // Use model names confirmed from your diagnostic list
  const modelNames = [
    "gemini-2.0-flash", 
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
    "gemini-pro-latest"
  ];
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are an expert FAA Flight Instructor. The student is summarizing "${params.chapterTitle}" from "${params.bookTitle}".
        
        TARGET KEY POINTS (with IDs):
        ${params.keyPoints.map(kp => `- [ID: ${kp.id}] ${kp.text}`).join('\n')}
        
        STUDENT TRANSCRIPT:
        "${params.transcript}"
        
        TASK:
        1. Identify which Target Key Points (by ID) the student successfully explained.
        2. Provide a short, encouraging sentence of feedback.
        3. Provide a Socratic clue (leading question) for ONE missing point.
        
        OUTPUT MUST BE VALID JSON ONLY:
        {
          "coveredPointIds": ["ID1", "ID2"],
          "feedback": "...",
          "clue": "..."
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const cleanJson = text.substring(startIdx, endIdx + 1);
        return JSON.parse(cleanJson);
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${modelName} failed:`, error.message);
      continue;
    }
  }

  // If all models fail, try to list models to help the user debug
  let availableModels = "Could not list models.";
  try {
    // This is a manual way to check if we can see any models at all
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    if (data.models) {
      availableModels = data.models.map((m: any) => m.name.replace('models/', '')).join(', ');
    }
  } catch (e) {
    console.error("Failed to list models:", e);
  }

  return {
    coveredPointIds: [],
    feedback: "Model Access Issue: " + (lastError?.message || "404 Not Found"),
    clue: "I couldn't find the Gemini models. Your key has access to: " + availableModels
  };
}
