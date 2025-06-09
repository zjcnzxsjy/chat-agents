"use client";

import { motion } from "framer-motion";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { ConfigField } from "../chat/components/configuration-sidebar/config-field";
import { useAgentsContext } from "@/providers/Agents";
import { useAgents } from "@/hooks/use-agents";
import { extractConfigurationsFromAgent } from "@/lib/ui-config";
import { ConfigurableFieldUIMetadata } from "@/types/configurable";
import { useSpeechRecording } from "./hooks/useSpeechRecording";
import { useStreamContext } from "./providers/Stream";
import { AudioVisualizerWithFallback } from "./components/audio-visualizer-with-fallback";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@langchain/langgraph-sdk";
import { ensureToolCallsHaveResponses } from "./utils/ensure-tool-responses";
import { useAuthContext } from "@/providers/Auth";

export default function VoiceInterface(): React.ReactNode {
  const { agents, loading: agentsLoading } = useAgentsContext();
  const { getAgentConfigSchema } = useAgents();
  const { session } = useAuthContext();
  const stream = useStreamContext();

  const {
    recordingState,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useSpeechRecording();

  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");

  const [configurations, setConfigurations] = useState<
    ConfigurableFieldUIMetadata[]
  >([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [processingTimeoutId, setProcessingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const form = useForm<{
    config: Record<string, any>;
  }>({
    defaultValues: {
      config: {},
    },
  });

  const init = useCallback(async () => {
    try {
      if (!agentId || !deploymentId) {
        return;
      }
      const audioAgent = agents.find((agent) => agent.name === "audio_agent");
      console.log("audioAgent", audioAgent);
      const schema = await getAgentConfigSchema(
        agentId,
        deploymentId
      );
      if (!schema) {
        setConfigurations([]);
      }
      const { configFields } =
        extractConfigurationsFromAgent({
          agent: audioAgent!,
          schema,
        });
      console.log("configFields", configFields);
      setConfigurations(configFields);
      const defaultConfig = configFields.reduce((acc, field) => {
        acc[field.label] = field.default;
        return acc;
      }, {} as Record<string, any>);
      form.setValue("config", defaultConfig);
    } catch (error) {
      console.error("Error fetching agent config schema", error);
      setConfigurations([]);
    }
  }, [agents]);

  const getButtonState = () => {
    if (recordingError) return 'error';
    if (isProcessingVoice || stream.isLoading) return 'processing';
    if (isPlayingAudio) return 'playing';
    if (recordingState === 'recording') return 'recording';
    if (recordingState === 'requesting') return 'requesting';
    return 'idle';
  };

  const handleRecordingToggle = async () => {
    if (isProcessingVoice || stream.isLoading) return;

    // Mark that user has interacted with the page
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      console.log('🎵 User interaction detected, audio playback now enabled');
    }

    if (recordingState === 'idle') {
      // Immediate visual feedback before starting recording
      setAudioLevel(0.1);
      const clickFrequency = new Uint8Array(128);
      for (let i = 0; i < 128; i++) {
        clickFrequency[i] = Math.floor(20 + Math.sin(i * 0.1) * 20);
      }
      setFrequencyData(clickFrequency);
      
      await startRecording();
    } else if (recordingState === 'recording') {
      // Show stopping animation
      setAudioLevel(0.05);
      
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await handleVoiceRecordingComplete(audioBlob);
      }
    }
  };

  const handleVoiceRecordingComplete = async (audioBlob: Blob) => {
    if (stream.isLoading) return;
    
    setIsProcessingVoice(true);

    // Set a timeout to prevent hanging if processing takes too long
    const timeoutId = setTimeout(() => {
      console.error('🚨 Voice processing timed out');
      setIsProcessingVoice(false);
      toast.error("Processing timed out", {
        description: "Please try recording a shorter message.",
      });
    }, 60000); // 60 second timeout

    setProcessingTimeoutId(timeoutId);
    
    try {
      console.log(`🎤 Processing audio blob:`, {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Check for extremely large files that might cause memory issues
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      if (audioBlob.size > maxSize) {
        console.error('🚨 Audio file too large:', audioBlob.size, 'bytes');
        toast.error("Audio file too large", {
          description: "Please record a shorter message (max 50MB).",
        });
        return;
      }

      // Convert blob to base64 for transmission with memory-efficient approach
      let base64Audio: string;
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Use chunks to prevent call stack overflow for large files
        const chunkSize = 8192; // 8KB chunks
        let binaryString = '';
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        
        base64Audio = btoa(binaryString);
        console.log('✅ Base64 conversion completed, length:', base64Audio.length);
      } catch (conversionError) {
        console.error('🚨 Base64 conversion failed:', conversionError);
        toast.error("Failed to process audio", {
          description: "Audio file format not supported.",
        });
        return;
      }
      
      // Submit audio data to LangGraph workflow
      const toolMessages = ensureToolCallsHaveResponses(stream.messages);
      stream.submit(
        { 
          audioInput: {
            audioData: base64Audio,
            mimeType: audioBlob.type,
            size: audioBlob.size
          }
        },
        {
          streamMode: ["values"],
          optimisticValues: (prev) => ({
            ...prev,
            messages: [
              ...(prev.messages ?? []),
              ...toolMessages,
              {
                id: uuidv4(),
                type: "human",
                content: "🎤 Voice message",
              } as Message,
            ],
          }),
          config: {
            configurable: form.getValues('config'),
          },
          metadata: {
            supabaseAccessToken: session?.accessToken,
          },
        },
      );

      toast.success("Voice message sent!", {
        description: "Processing your request...",
      });
      
    } catch (error) {
      console.error('Error processing voice recording:', error);
      toast.error("Failed to process voice recording", {
        description: "Please try again.",
      });
    } finally {
      // Clear the timeout and reset processing state
      if (processingTimeoutId) {
        clearTimeout(processingTimeoutId);
        setProcessingTimeoutId(null);
      }
      setIsProcessingVoice(false);
    }
  };

  const setupAudioVisualization = (audioElement: HTMLAudioElement) => {
    try {
      // Create a new AudioContext for each audio playback since we close it after each use
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const audioContext = audioContextRef.current;
      
      // Resume audio context if it's suspended (common in modern browsers)
      if (audioContext.state === 'suspended') {
        console.log('🎵 Audio context suspended, resuming...');
        audioContext.resume().then(() => {
          console.log('🎵 Audio context resumed successfully');
        });
      }
      
      const source = audioContext.createMediaElementSource(audioElement);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      
      console.log('🎵 Audio visualization setup complete - analyser created');
      
      let isAnimating = true;
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isAnimating) {
          console.log('🎵 updateAudioLevel early return - analyser:', !!analyserRef.current, 'animating:', isAnimating);
          return;
        }
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Update frequency data for visualizer
        setFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
        
        // Log frequency data for debugging
        const maxFreq = Math.max(...dataArray);
        if (maxFreq > 0) {
          console.log('🎵 Frequency data - max:', maxFreq, 'avg:', average.toFixed(2), 'normalized:', normalizedLevel.toFixed(2));
        }
        
        setAudioLevel(normalizedLevel);
        
        if (isAnimating) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      // Store cleanup function on the audio element
      (audioElement as any).stopVisualization = () => {
        console.log('🎵 Stopping visualization');
        isAnimating = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
      
      // Start the visualization loop immediately
      updateAudioLevel();
    } catch (error) {
      console.warn('Audio visualization setup failed:', error);
      // Fallback to simple random visualization
      let fallbackInterval: NodeJS.Timeout;
      const startFallback = () => {
        fallbackInterval = setInterval(() => {
          if (!isPlayingAudio) {
            clearInterval(fallbackInterval);
            return;
          }
          const simLevel = Math.random() * 0.6 + 0.2;
          setAudioLevel(simLevel);
          
          // Simulate frequency data
          const simFreq = new Uint8Array(128);
          for (let i = 0; i < 128; i++) {
            simFreq[i] = Math.floor(Math.random() * simLevel * 255);
          }
          setFrequencyData(simFreq);
        }, 100);
      };
      startFallback();
    }
  };

  const playAudioFromBase64 = async (base64Audio: string) => {
    console.log('🎵 playAudioFromBase64 called with base64 length:', base64Audio.length);
    
    // Prevent playing if already playing to avoid conflicts
    if (isPlayingAudio) {
      console.log('🎵 Audio already playing, skipping new request');
      return;
    }

    // Validate base64 data
    if (!base64Audio || base64Audio.length === 0) {
      console.error('🎵 Invalid base64 audio data');
      toast.error("Invalid audio data");
      return;
    }

    // Check for extremely large audio data that might cause issues
    const maxBase64Length = 100 * 1024 * 1024; // ~75MB when decoded
    if (base64Audio.length > maxBase64Length) {
      console.error('🎵 Base64 audio data too large:', base64Audio.length);
      toast.error("Audio response too large to play");
      return;
    }

    try {
      // Clean up any existing audio resources first
      if (animationFrameRef.current) {
        console.log('🧹 Cancelling animation frame');
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (currentAudioUrlRef.current) {
        console.log('🧹 Cleaning up existing audio URL');
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      
      // Clean up existing audio context and analyser
      if (audioContextRef.current) {
        console.log('🧹 Cleaning up existing audio context');
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      if (analyserRef.current) {
        console.log('🧹 Cleaning up existing analyser');
        analyserRef.current = null;
      }

      setIsPlayingAudio(true);
      setAudioLevel(0);
      
      // Convert base64 to blob with error handling
      console.log('🎵 Converting base64 to blob...');
      let binaryString: string;
      let audioBlob: Blob;
      let audioUrl: string;
      
      try {
        binaryString = atob(base64Audio);
      } catch (decodeError) {
        console.error('🎵 Base64 decode failed:', decodeError);
        throw new Error('Invalid base64 audio format');
      }
      
      try {
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        audioBlob = new Blob([bytes], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
        console.log('🎵 Created blob URL:', audioUrl);
      } catch (blobError) {
        console.error('🎵 Blob creation failed:', blobError);
        throw new Error('Failed to create audio blob');
      }

      // Store the current URL for cleanup
      currentAudioUrlRef.current = audioUrl;

      // Create a fresh audio element for this playback
      const audio = new Audio();
      audioRef.current = audio;
      
      console.log('🎵 Created fresh audio element');

      // Set up event handlers
      const cleanup = () => {
        console.log('🎵 Cleaning up audio playback');
        setIsPlayingAudio(false);
        setAudioLevel(0);
        setFrequencyData(new Uint8Array(128));
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
          currentAudioUrlRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
          audioContextRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current = null;
        }
      };

      audio.onloadeddata = () => {
        console.log('🎵 Base64 audio loaded successfully');
        // Small delay to ensure audio is ready
        setTimeout(() => {
          setupAudioVisualization(audio);
        }, 100);
      };
      
      audio.onended = () => {
        console.log('🎵 Base64 audio playback ended');
        if ((audio as any).stopVisualization) {
          (audio as any).stopVisualization();
        }
        cleanup();
      };
      
      audio.onerror = (e) => {
        console.error('🎵 Base64 audio error:', e);
        cleanup();
        
        // Handle autoplay policy errors specifically
        if (e instanceof Error && e.name === 'NotAllowedError') {
          console.log('🎵 Autoplay blocked - this is normal browser behavior');
          toast.info("Audio ready to play", {
            description: "Click the record button to enable audio playback",
            duration: 3000,
          });
        } else {
          toast.error("Failed to play audio response");
        }
      };

      audio.onplay = () => {
        console.log('🎵 Audio started playing');
      };

      audio.onpause = () => {
        console.log('🎵 Audio paused');
      };
      
      // Set the source and attempt to play
      audio.src = audioUrl;
      console.log('🎵 Attempting to play base64 audio...');
      await audio.play();
      console.log('🎵 Base64 audio play() succeeded');
      toast.success("Playing response");
      
    } catch (error) {
      console.error('🎵 Error playing audio from base64:', error);
      setIsPlayingAudio(false);
      setAudioLevel(0);
      setFrequencyData(new Uint8Array(128));
      
      // Handle autoplay policy errors specifically
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('🎵 Autoplay blocked - this is normal browser behavior');
        toast.info("Audio ready to play", {
          description: "Click the record button to enable audio playback",
          duration: 3000,
        });
      } else {
        toast.error("Failed to play audio response");
      }
    }
  };

  const getStatusText = () => {
    const state = getButtonState();
    switch (state) {
      case 'recording':
        return audioLevel > 0 ? "Listening... Keep speaking" : "Listening... Speak a bit louder";
      case 'processing':
        return "Processing your voice...";
      case 'playing':
        return "Playing response...";
      case 'requesting':
        return "Requesting microphone access...";
      case 'error':
        return "Something went wrong";
      default:
        return "Tap to start speaking";
    }
  };

  const getSubtitleText = () => {
    const state = getButtonState();
    switch (state) {
      case 'recording':
        return "Tap again to finish";
      case 'processing':
        return "Please wait a moment";
      case 'playing':
        return "Audio response playing";
      case 'requesting':
        return "Allow microphone access";
      case 'error':
        return "Please try again";
      default:
        return "Speak naturally";
    }
  };
  
  useEffect(() => {
    init();
  }, [init]);

  // Handle stream messages for audio playback - Refactored to prevent infinite loops
  useEffect(() => {
    // Early return if no stream values or still loading
    if (!stream.values || stream.isLoading) {
      return;
    }

    // Check for ttsOutput directly in the stream values (this is where ElevenLabs audio should be)
    if (stream.values.ttsOutput && stream.values.ttsOutput.audioData) {
      const ttsOutput = stream.values.ttsOutput;
      console.log('🎵 Found TTS output in stream values:', {
        audioDataLength: ttsOutput.audioData.length,
        mimeType: ttsOutput.mimeType,
        size: ttsOutput.size,
        hasUserInteracted: hasUserInteracted
      });
      
      // Use a combination of message count and TTS data length as unique identifier to prevent re-processing
      const currentTtsId = `tts_${stream.messages.length}_${ttsOutput.audioData.length}`;
      if (currentTtsId !== lastProcessedMessageId) {
        console.log('🎵 Playing new TTS audio from stream values');
        setLastProcessedMessageId(currentTtsId);
        
        // Only play audio if user has interacted with the page
        if (hasUserInteracted) {
          playAudioFromBase64(ttsOutput.audioData).catch(error => {
            console.error('🎵 Error playing TTS audio:', error);
          });
        } else {
          console.log('🎵 Waiting for user interaction before playing audio');
          toast.info("Audio response ready", {
            description: "Click the record button to enable audio playback",
            duration: 3000,
          });
        }
      }
    }
  }, [stream.values?.ttsOutput, stream.isLoading, lastProcessedMessageId, hasUserInteracted]);

  // Handle AI messages for audio playback - Separate effect to reduce complexity
  useEffect(() => {
    if (stream.isLoading || !stream.messages.length) {
      return;
    }

    const lastMessage = stream.messages[stream.messages.length - 1];
    
    // Only process AI messages that we haven't processed before
    if (
      lastMessage?.type === "ai" && 
      lastMessage.id && 
      lastMessage.id !== lastProcessedMessageId
    ) {
      console.log('🎵 Processing AI message for audio:', {
        messageId: lastMessage.id,
        messageType: lastMessage.type
      });
      
      // Check for ttsOutput field (this is where ElevenLabs audio is stored)
      const ttsOutput = (lastMessage as any).ttsOutput;
      if (ttsOutput && ttsOutput.audioData) {
        console.log('🎵 Found TTS output in message:', {
          audioDataLength: ttsOutput.audioData.length,
          mimeType: ttsOutput.mimeType,
          size: ttsOutput.size
        });
        setLastProcessedMessageId(lastMessage.id);
        playAudioFromBase64(ttsOutput.audioData).catch(error => {
          console.error('🎵 Error playing message TTS audio:', error);
        });
        return;
      }
      
      // Check additional_kwargs for audio
      const additionalKwargs = (lastMessage as any).additional_kwargs;
      if (additionalKwargs?.ttsOutput && additionalKwargs.ttsOutput.audioData) {
        console.log('🎵 Found TTS output in additional_kwargs');
        setLastProcessedMessageId(lastMessage.id);
        playAudioFromBase64(additionalKwargs.ttsOutput.audioData).catch(error => {
          console.error('🎵 Error playing additional_kwargs TTS audio:', error);
        });
        return;
      }
      
      // Check response_metadata for audio
      const responseMetadata = (lastMessage as any).response_metadata;
      if (responseMetadata?.ttsOutput && responseMetadata.ttsOutput.audioData) {
        console.log('🎵 Found TTS output in response_metadata');
        setLastProcessedMessageId(lastMessage.id);
        playAudioFromBase64(responseMetadata.ttsOutput.audioData).catch(error => {
          console.error('🎵 Error playing response_metadata TTS audio:', error);
        });
        return;
      }
      
      console.log('❌ No audio data found in AI message');
    }
  }, [stream.messages, stream.isLoading, lastProcessedMessageId]);
  
  return (
    <div className="flex h-full overflow-x-hidden px-4">
      <div className="p-4 w-[480px] overflow-y-auto">
        {configurations.length > 0 && (
          <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
            {configurations.map((c, index) => (
              <Controller
                key={`${c.label}-${index}`}
                control={form.control}
                name={`config.${c.label}`}
                render={({ field: { value, onChange } }) => (
                  <ConfigField
                    className="w-full"
                    id={c.label}
                    label={c.label}
                    type={
                      c.type === "boolean" ? "switch" : (c.type ?? "text")
                    }
                    description={c.description}
                    placeholder={c.placeholder}
                    options={c.options}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={value}
                    setValue={onChange}
                    agentId={agentId!}
                  />
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center flex-auto p-8 relative overflow-hidden">
        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          preload="none"
          className="hidden"
        />
        
        {/* Gentle background ambient animation for dark theme */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)"
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)"
            }}
            animate={{ 
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center space-y-12 max-w-md mx-auto text-center">
          {/* App title - Static, no movement */}
          <div className="space-y-3">
          </div>

          {/* Main audio visualization - dots only */}
          <div className="relative w-96 h-96 flex items-center justify-center">
            {/* 3D Audio Visualizer */}
            <div 
              className="w-full h-full cursor-pointer"
              onClick={handleRecordingToggle}
            >
              <AudioVisualizerWithFallback
                audioLevel={audioLevel}
                isRecording={recordingState === 'recording'}
                isPlaying={isPlayingAudio}
                isProcessing={isProcessingVoice || stream.isLoading}
                frequencyData={frequencyData}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Status text - Static positioning, no movement */}
          <div className="space-y-2 h-16 flex flex-col justify-center">
            <p className="text-xl font-semibold text-gray-200">
              {getStatusText()}
            </p>
            <p className="text-sm text-gray-400 font-medium">
              {getSubtitleText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

