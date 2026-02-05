'use server';

export async function synthesizeSpeech(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  // Try beta first for Achernar, fallback to v1 for stability
  const endpoints = [
    `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`
  ];

  const body = {
    input: { text },
    voice: {
      languageCode: "en-US",
      name: "en-US-Journey-F", // Primary choice: Achernar
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: 0,
      speakingRate: 1.0
    },
  };

  const fallbackVoiceBody = {
    ...body,
    voice: {
      languageCode: "en-US",
      name: "en-US-Studio-O", // Reliable Studio fallback
    }
  };

  let lastError = null;

  for (const url of endpoints) {
    for (const currentBody of [body, fallbackVoiceBody]) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentBody),
        });

        const data = await response.json();
        if (data.audioContent) {
          return data.audioContent; 
        } else {
          lastError = data.error?.message || JSON.stringify(data);
          console.warn(`TTS Trial (Voice: ${currentBody.voice.name}) failed:`, lastError);
        }
      } catch (error: any) {
        lastError = error.message;
        continue;
      }
    }
  }

  // If all endpoints fail
  if (lastError?.includes("blocked")) {
    return { error: "API_KEY_RESTRICTED", details: "Your API key is blocking Text-to-Speech. Please check your Google Cloud Console API restrictions." };
  }
  return { error: lastError };
}
