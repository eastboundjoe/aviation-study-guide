'use server';

export async function synthesizeSpeech(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const body = {
    input: { text },
    voice: {
      languageCode: "en-US",
      name: "en-US-Studio-O", // "Achernar" is often mapped to Studio-O or specific Journey voices
    },
    audioConfig: {
      audioEncoding: "MP3",
      effectsProfileId: ["handset-class-device"],
      pitch: 0,
      speakingRate: 1.0
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.audioContent) {
      return data.audioContent; 
    } else {
      // Return the error message to the frontend for debugging
      const errorMsg = data.error?.message || JSON.stringify(data);
      console.error("TTS API Error Details:", errorMsg);
      return { error: errorMsg };
    }
  } catch (error: any) {
    console.error("TTS Fetch Error:", error.message);
    return { error: error.message };
  }
}
