import { HumanMessage } from "@langchain/core/messages";
import { AssemblyAI } from "assemblyai";
import { base64ToBuffer } from "../utils.js";
import { SpeechAnnotation } from "../configuration.js";
import { toFile } from "../toFile.js";

export async function speechToText(state: typeof SpeechAnnotation.State): Promise<typeof SpeechAnnotation.Update> {
  const { audioInput } = state
  try {
    if (!audioInput) {
      console.log("🎤 No audio input, passing through to AI node");
      return {};
    }
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY!,
    });
    // Log debug information
    console.log("🎤 Processing audio input:", {
      audioDataLength: audioInput.audioData?.length,
      mimeType: audioInput.mimeType,
      size: audioInput.size
    });
    // Check if audio data exists and is reasonable size
    if (!audioInput.audioData || audioInput.audioData.length < 100) {
      console.error("🎤 Audio data is missing or too small:", audioInput.audioData?.length || 0, "characters");
      throw new Error("Audio data appears to be empty or too short");
    }
    const audioBuffer = base64ToBuffer(audioInput.audioData);

    // Function to attempt transcription with given buffer and format
    const attemptTranscription = async (buffer: Buffer, fileName: string, mimeType: string) => {
      console.log(`🎤 Attempting transcription:`, {
        fileName,
        bufferSize: buffer.length,
        mimeType
      });

      const file = await toFile(buffer, fileName);

      let transcript = await client.transcripts.transcribe({
        audio: file,
        language_detection: true,
      });
      return transcript.text;
    };

    // Try different formats in order of compatibility
    const formats = [
      { name: "audio.wav", type: "audio/wav" },
      { name: "audio.webm", type: "audio/webm" },
      { name: "audio.mp3", type: "audio/mp3" },
      { name: "audio.m4a", type: "audio/m4a" },
      { name: "audio.ogg", type: "audio/ogg" },
    ];

    let lastError: any = null;

    for (const format of formats) {
      try {
        console.log(`🎯 Trying format: ${format.name} (${format.type})`);
        
        const transcription = await attemptTranscription(
          audioBuffer, 
          format.name, 
          format.type
        );
        
        // If we get here, transcription succeeded
        const humanMessage = new HumanMessage({
          content: transcription!,
        });

        console.log(`🎤 Speech transcribed successfully with ${format.name}: "${transcription}"`);
        return {
          messages: [humanMessage],
          audioInput: undefined,
        };

      } catch (error) {
        console.log(`❌ Format ${format.name} failed:`, error instanceof Error ? error.message : error);
        lastError = error;
        continue;
      }
    }

    // If all formats failed, throw the last error
    throw lastError || new Error("All audio formats failed");
  } catch (error) {
    console.error("Error processing speech - all formats failed:", error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Create an error message
    const errorMessage = new HumanMessage({
      content: "Sorry, I couldn't process your voice message. Please try again or type your message.",
    });

    return {
      messages: [errorMessage],
      audioInput: undefined,
    };
  }
}