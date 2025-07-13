import { RunnableConfig } from "@langchain/core/runnables";
import * as path from "path";
import { ensureConfiguration, ResearchState, TTSOutput } from "../configuration.js";
import { getTTSPrompt } from "../prompts.js";
import { GoogleGenAI } from "@google/genai";
import wav from 'wav';
import * as fs from 'fs';


async function saveWaveFile(
  filename: string,
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
) {
  return new Promise((resolve, reject) => {
     const writer = new wav.FileWriter(filename, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
     });

     writer.on('finish', resolve);
     writer.on('error', reject);

     writer.write(pcmData);
     writer.end();
  });
}

export default async function textToSpeech(state: typeof ResearchState.State, config: RunnableConfig) {
  const { synthesisText } = state;
  const prompt = getTTSPrompt(synthesisText);
  // const configuration = ensureConfiguration(config);
  // const tools = await getTools();

  // const model = await loadChatModel(configuration.synthesisModel!);

  // const reactAgent = createReactAgent({ 
  //   llm: model, 
  //   tools: tools,
  //   stateModifier: prompt,
  // });
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  // Uses the google genai client as the langchain client doesn't return grounding metadata
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
                speaker: 'Mike',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
            },
            {
                speaker: 'Dr. Sarah',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' }
                }
            }
          ]
        }
      }
    },
  });

  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) {
    throw new Error("TTS 响应未返回音频数据");
  }
  const audioBuffer = Buffer.from(data, 'base64');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `tts-output-${timestamp}.mp3`;
  const outputPath = path.join(process.cwd(), 'tts-outputs', filename);

  await saveWaveFile(outputPath, audioBuffer);
  // const base64Audio = audioBuffer.toString('base64');
  // console.log("audioBuffer", audioBuffer);
  // console.log("output", base64Audio);

  const ttsOutput: TTSOutput = {
    audioData: data,
    mimeType: "audio/mpeg",
    size: audioBuffer.length
  };

  return {
    ttsOutput
  }
}