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
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";
import { ProcessedEvent } from "@/features/chat/components/thread/messages/activity-time-line";


// Define the TTS output interface to match backend
export interface TTSOutput {
  audioData: string; // base64 encoded audio data
  mimeType: string;
  size: number;
}

export type StateType = { 
  messages: Message[]; 
  ui?: UIMessage[];
  ttsOutput?: TTSOutput;
  history: Record<string, any>;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      output?: TTSOutput;
      history?: Record<string, any>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
type ExtendedStreamContextType = StreamContextType & {
  activeReportId: string | null;
  processedEventsTimeline: ProcessedEvent[];
  historicalActivities: Record<string, ProcessedEvent[]>;
  hasFinalizeEventOccurred: boolean;
  setProcessedEventsTimeline: React.Dispatch<React.SetStateAction<ProcessedEvent[]>>;
  setHistoricalActivities: React.Dispatch<React.SetStateAction<Record<string, ProcessedEvent[]>>>;
  setHasFinalizeEventOccurred: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveReportId: React.Dispatch<React.SetStateAction<string | null>>;
};

const StreamContext = createContext<ExtendedStreamContextType | undefined>(undefined);

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
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<
    ProcessedEvent[]
  >([]);
  const [historicalActivities, setHistoricalActivities] = useState<
    Record<string, ProcessedEvent[]>
  >({});

  const [hasFinalizeEventOccurred, setHasFinalizeEventOccurred] = useState(false);

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
    onUpdateEvent: (event: any) => {
      let processedEvent: ProcessedEvent | null = null;
      console.log('event', event)
      if (event.generateQuery) {
        processedEvent = {
          title: "Generating Search Queries",
          data: event.generateQuery.queryList.join(", "),
        };
      } else if (event.webResearch) {
        const sources = event.webResearch.sourcesGathered || [];
        const numSources = sources.length;
        const uniqueLabels = [
          ...new Set(sources.map((s: any) => s.label).filter(Boolean)),
        ];
        const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
        processedEvent = {
          title: "Web Research",
          data: `Gathered ${numSources} sources. Related to: ${
            exampleLabels || "N/A"
          }.`,
        };
      } else if (event.reflection) {
        processedEvent = {
          title: "Reflection",
          data: event.reflection.isSufficient
            ? "Search successful, generating final answer."
            : `Need more information, searching for ${event.reflection.followUpQueries.join(
                ", "
              )}`,
        };
      } else if (event.finalizeAnswer) {
        processedEvent = {
          title: "Finalizing Answer",
          data: "Composing and presenting the final answer.",
        };
        const { messages } = event.finalizeAnswer;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.type === "ai") {
          setActiveReportId(lastMessage.id ?? null);
        }
        setHasFinalizeEventOccurred(true)
      }
      if (processedEvent) {
        setProcessedEventsTimeline((prevEvents) => [
          ...prevEvents,
          processedEvent!,
        ]);
      }
    },
    defaultHeaders: {
      Authorization: `Bearer ${session?.accessToken}`,
      "x-supabase-access-token": session?.accessToken,
    },
  });

  console.log('streamValue', streamValue)

  return (
    <StreamContext.Provider value={{
      ...streamValue,
      activeReportId,
      processedEventsTimeline,
      historicalActivities,
      hasFinalizeEventOccurred,
      setActiveReportId,
      setProcessedEventsTimeline,
      setHistoricalActivities,
      setHasFinalizeEventOccurred,
    }}>
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
    const deepResearchAgent = agents.find((agent) => agent.name === "deep_research_agent");
    setValue(`${deepResearchAgent!.assistant_id}:${deepResearchAgent!.deploymentId}`);
    setAgentId(deepResearchAgent!.assistant_id);
    setDeploymentId(deepResearchAgent!.deploymentId);
    if (deepResearchAgent) {
      setValue(`${deepResearchAgent.assistant_id}:${deepResearchAgent.deploymentId}`);
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
export const useStreamContext = (): ExtendedStreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
