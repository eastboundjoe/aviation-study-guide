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
      return data.audioContent; // Base64 audio string
    } else {
      console.error("TTS API Error:", data);
      return null;
    }
  } catch (error) {
    console.error("TTS Fetch Error:", error);
    return null;
  }
}
