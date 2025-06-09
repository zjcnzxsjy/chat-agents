import { DEFAULT_BITRATE, DEFAULT_CHANNEL, DEFAULT_EMOTION, DEFAULT_FORMAT, DEFAULT_LANGUAGE_BOOST, DEFAULT_PITCH, DEFAULT_SAMPLE_RATE, DEFAULT_SPEECH_MODEL, DEFAULT_SPEED, DEFAULT_VOICE_ID, DEFAULT_VOLUME } from "../const/index.js";
import { Config, TTSRequest } from "../types/index.js";
import { MiniMaxAPI } from "./index.js";
import { TTSAPI } from "./tts.js";

export async function textToAudio(config: TTSRequest) {
  // Build TTS request parameters
  const ttsParams = {
    text: config.text,
    outputDirectory: config.outputDirectory,
    voiceId: config.voiceId || DEFAULT_VOICE_ID,
    model: config.model || DEFAULT_SPEECH_MODEL,
    speed: config.speed || DEFAULT_SPEED,
    vol: config.vol || DEFAULT_VOLUME,
    pitch: config.pitch || DEFAULT_PITCH,
    emotion: config.emotion,
    format: config.format || DEFAULT_FORMAT,
    sampleRate: config.sampleRate || DEFAULT_SAMPLE_RATE,
    bitrate: config.bitrate || DEFAULT_BITRATE,
    channel: config.channel || DEFAULT_CHANNEL,
    languageBoost: config.languageBoost || DEFAULT_LANGUAGE_BOOST,
    outputFile: config.outputFile,
    latexRead: config.latexRead || false,
  };

  // Update configuration with request-specific parameters
  const requestConfig: Partial<Config> = {
    apiKey: process.env.MINIMAX_API_KEY,
    resourceMode: "hex",
  };

  // Update API instance
  const requestApi = new MiniMaxAPI(requestConfig as Config);
  const requestTtsApi = new TTSAPI(requestApi);

  // Automatically set resource mode (if not specified)
  const outputFormat = requestConfig.resourceMode;
  const ttsRequest = {
    ...ttsParams,
    outputFormat,
  };

  // If no output filename is provided, generate one automatically
  if (!ttsRequest.outputFile) {
    const textPrefix = ttsRequest.text.substring(0, 20).replace(/[^\w]/g, '_');
    ttsRequest.outputFile = `tts_${textPrefix}_${Date.now()}`;
  }

  return requestTtsApi.generateSpeech(ttsRequest);
}
