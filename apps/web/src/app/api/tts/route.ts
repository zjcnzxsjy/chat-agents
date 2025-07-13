import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const api_key = process.env.NEXT_MINIMAX_API_KEY;
  const body = await req.json();

  const requestBody = {
    "model": "speech-02-hd",
    "text": body.content,
    "timber_weights": [
      {
        "voice_id": "Chinese (Mandarin)_Radio_Host",
        "weight": 1
      }
    ],
    "voice_setting": {
      "voice_id": "",
      "speed": 1,
      "pitch": 0,
      "vol": 1,
      "latex_read": false
    },
    "audio_setting": {
      "sample_rate": 32000,
      "bitrate": 128000,
      "format": "mp3"
    },
    "language_boost": "auto"
  }

  const response = await fetch(`https://api.minimax.chat/v1/t2a_v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${api_key}`,
    },
    body: JSON.stringify(requestBody)
  })
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: response.status })
  }
  const { data } = await response.json()
  const audioBuffer = Buffer.from(data.audio, 'hex');
  const newResponse = NextResponse.json({
    audio: audioBuffer.toString('base64'),
  }, {
    status: response.status,
    statusText: response.statusText,
  });

  return newResponse
}
