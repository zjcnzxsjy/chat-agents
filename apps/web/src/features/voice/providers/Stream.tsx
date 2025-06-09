"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { useAgentsContext } from "@/providers/Agents";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isUserSpecifiedDefaultAgent } from "@/lib/agent-utils";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";

// Define the speech input interface to match backend
interface SpeechInput {
  audioData: string; // base64 encoded audio
  mimeType?: string;
  size?: number;
}

// Define the TTS output interface to match backend
export interface TTSOutput {
  audioData: string; // base64 encoded audio data
  mimeType: string;
  size: number;
}

export type StateType = { 
  messages: Message[]; 
  ui?: UIMessage[];
  audioInput?: SpeechInput;
  ttsOutput?: TTSOutput;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      audioInput?: SpeechInput;
      ttsOutput?: TTSOutput;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

const StreamSession = ({
  children,
  agentId,
  deploymentId,
}: {
  children: ReactNode;
  agentId: string;
  deploymentId: string;
}) => {
  const { session } = useAuthContext();

  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }
  const [threadId, setThreadId] = useQueryState("threadId");
  const streamValue = useTypedStream({
    apiUrl: deployment.deploymentUrl,
    assistantId: agentId,
    threadId: threadId ?? null,
    onCustomEvent: (event, options) => {
      options.mutate((prev) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
    },
    onThreadId: (id) => {
      setThreadId(id);
    },
    defaultHeaders: {
      Authorization: `Bearer ${session?.accessToken}`,
      "x-supabase-access-token": session?.accessToken,
    },
  });

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { agents } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (value || !agents.length) {
      return;
    }
    const audioAgent = agents.find((agent) => agent.name === "audio_agent");
    setValue(`${audioAgent!.assistant_id}:${audioAgent!.deploymentId}`);
    setAgentId(audioAgent!.assistant_id);
    setDeploymentId(audioAgent!.deploymentId);
    if (audioAgent) {
      setValue(`${audioAgent.assistant_id}:${audioAgent.deploymentId}`);
    }
  }, [agents]);

  if (!agentId || !deploymentId) {
    return null;
  }

  return (
    <StreamSession
      agentId={agentId}
      deploymentId={deploymentId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
