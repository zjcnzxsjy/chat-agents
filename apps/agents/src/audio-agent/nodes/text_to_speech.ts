// import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import * as path from "path";
import { ensureConfiguration, SpeechAnnotation, TTSOutput } from "../configuration.js";
import { textToAudio } from "../api/audio.js";
import { RunnableConfig } from "@langchain/core/runnables";

const fetchMinimax = async (text: string, config: RunnableConfig) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `tts-output-${timestamp}.mp3`;
  const outputPath = path.join(process.cwd(), 'tts-outputs', filename);

  const configuration = ensureConfiguration(config);
  const requestBody = {
    "model": "speech-02-hd",
    "text": text,
    "voiceId": configuration.voiceId,
    "speed": configuration.speed,
    "pitch": configuration.pitch,
    "vol": configuration.vol,
    "emotion": configuration.emotion,
    "latexRead": configuration.latexRead,
    "sampleRate": 32000,
    "bitrate": 128000,
    "format": "mp3",
    "languageBoost": configuration.language,
    "outputFile": outputPath
  }
  // const chunks: Uint8Array[] = [];
  return textToAudio(requestBody)
}

/**
 * Process AI message and convert it to speech using ElevenLabs TTS
 */
export async function textToSpeech(
  state: typeof SpeechAnnotation.State,
  config: RunnableConfig
): Promise<typeof SpeechAnnotation.Update> {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  console.log("🔊 TTS Debug - Messages in state:", {
    totalMessages: messages.length,
    lastMessageType: lastMessage?.constructor?.name,
    lastMessageContent: typeof lastMessage?.content,
    lastMessagePreview: typeof lastMessage?.content === 'string' ? lastMessage.content.substring(0, 50) + '...' : lastMessage?.content
  });
  
  // Only process AI messages (both AIMessage and AIMessageChunk)
  if (!lastMessage || !(lastMessage instanceof AIMessage || lastMessage instanceof AIMessageChunk)) {
    console.log("🔊 No AI message to convert to speech - lastMessage:", {
      exists: !!lastMessage,
      type: lastMessage?.constructor?.name,
      isAIMessage: lastMessage instanceof AIMessage,
      isAIMessageChunk: lastMessage instanceof AIMessageChunk
    });
    return { ttsOutput: undefined };
  }

  const aiMessage = lastMessage as AIMessage | AIMessageChunk;
  const textContent = aiMessage.content as string;

  if (!textContent || typeof textContent !== "string") {
    console.log("🔊 No text content found in AI message:", {
      contentType: typeof textContent,
      content: textContent
    });
    return { ttsOutput: undefined };
  }

  try {

    console.log("🔊 Converting text to speech:", {
      textLength: textContent.length,
      textPreview: textContent.substring(0, 100) + (textContent.length > 100 ? "..." : "")
    });
  
    const audioBuffer = await fetchMinimax(textContent, config)

    console.log("🎵 Audio generated successfully");

    console.log("✅ Audio buffer created, size:", audioBuffer.length, "bytes");

    // Convert to base64 for transmission
    const base64Audio = audioBuffer.toString('base64');

    const ttsOutput: TTSOutput = {
      audioData: base64Audio,
      mimeType: "audio/mpeg",
      size: audioBuffer.length
    };

    console.log("🔊 TTS processing completed successfully:", {
      outputSize: ttsOutput.size,
      mimeType: ttsOutput.mimeType,
      base64Length: base64Audio.length
    });

    return {
      ttsOutput: ttsOutput
    };

  } catch (error) {
    console.error("Error processing TTS:", error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("TTS Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Return undefined TTS output on error - don't fail the whole flow
    return {
      ttsOutput: undefined
    };
  }
}
