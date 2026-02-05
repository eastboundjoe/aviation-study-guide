'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeRecall(params: {
  chapterTitle: string;
  bookTitle: string;
  keyPoints: { text: string; id: string }[];
  transcript: string;
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert FAA Flight Instructor and study partner. 
    The student is studying the chapter "${params.chapterTitle}" from the book "${params.bookTitle}".
    
    Here are the TARGET KEY POINTS they need to cover (with their unique IDs):
    ${params.keyPoints.map(kp => `- [ID: ${kp.id}] ${kp.text}`).join('\n')}
    
    Here is the student's verbal summary (transcribed):
    "${params.transcript}"
    
    YOUR TASK:
    1. Identify which Target Key Points (by ID) the student successfully explained.
    2. Provide a friendly "Socratic" clue for the most important missing point. Do NOT give the answer. Ask a leading question to help them remember.
    
    Return your response in this EXACT JSON format:
    {
      "coveredPointIds": ["id1", "id2"],
      "feedback": "A short sentence praising what they got right.",
      "clue": "Your leading question for the missing info."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Find the first { and last } to extract JSON even if there's markdown or text around it
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Could not find JSON in response");
    }

    const cleanJson = text.substring(startIdx, endIdx + 1);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a more descriptive error if possible
    return {
      coveredPointIds: [],
      feedback: "I'm here, but I had a slight sync issue. Try summarizing one more time?",
      clue: "Sometimes I miss things if the connection drops. Can you repeat your last point about " + (params.keyPoints[0]?.text.split(' ')[0] || "this chapter") + "?"
    };
  }
}
