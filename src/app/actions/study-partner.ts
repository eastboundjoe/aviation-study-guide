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

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert FAA Flight Instructor. The student is summarizing "${params.chapterTitle}" from "${params.bookTitle}".
    
    TARGET KEY POINTS (with IDs):
    ${params.keyPoints.map(kp => `- [ID: ${kp.id}] ${kp.text}`).join('\n')}
    
    STUDENT TRANSCRIPT:
    "${params.transcript}"
    
    TASK:
    1. List the IDs of the Target Key Points the student successfully explained.
    2. Provide a short, encouraging sentence of feedback.
    3. Provide a Socratic clue (leading question) for ONE missing point.
    
    OUTPUT MUST BE VALID JSON ONLY:
    {
      "coveredPointIds": ["ID1", "ID2"],
      "feedback": "...",
      "clue": "..."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      return {
        coveredPointIds: [],
        feedback: "The AI didn't return a proper format.",
        clue: "Raw response: " + text.substring(0, 50) + "..."
      };
    }

    const cleanJson = text.substring(startIdx, endIdx + 1);
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return {
      coveredPointIds: [],
      feedback: "Connection Error: " + (error.message || "Unknown error"),
      clue: "Check your internet connection or API quota in Google AI Studio."
    };
  }
}
