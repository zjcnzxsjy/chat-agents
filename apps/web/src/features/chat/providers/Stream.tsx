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
import { ProcessedEvent } from "../components/thread/messages/activity-time-line";
import { Agent } from "@/types/agent";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

export interface TTSOutput {
  audioData: string; // base64 encoded audio data
  mimeType: string;
  size: number;
}

export type VoiceStateType = { 
  researchText: string;
  ttsOutput?: TTSOutput;
};

const useVoiceStream = useStream<
  VoiceStateType,
  {
    UpdateType: VoiceStateType;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
export type VoiceStreamContextType = ReturnType<typeof useVoiceStream>;

type ExtendedStreamContextType = StreamContextType & {
  processedEventsTimeline: ProcessedEvent[];
  historicalActivities: Record<string, ProcessedEvent[]>;
  hasFinalizeEventOccurred: boolean;
  setProcessedEventsTimeline: React.Dispatch<React.SetStateAction<ProcessedEvent[]>>;
  setHistoricalActivities: React.Dispatch<React.SetStateAction<Record<string, ProcessedEvent[]>>>;
  setHasFinalizeEventOccurred: React.Dispatch<React.SetStateAction<boolean>>;
  voiceStream: VoiceStreamContextType;
};
const StreamContext = createContext<ExtendedStreamContextType | undefined>(undefined);

const StreamSession = ({
  children,
  agentId,
  deploymentId,
  audioAgentId,
}: {
  children: ReactNode;
  agentId: string;
  deploymentId: string;
  audioAgentId: string;
}) => {
  const { session } = useAuthContext();

  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }
  const [threadId, setThreadId] = useQueryState("threadId");
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

  const voiceStream = useVoiceStream({
    apiUrl: deployment.deploymentUrl,
    assistantId: audioAgentId,
    threadId: null,
    defaultHeaders: {
      Authorization: `Bearer ${session?.accessToken}`,
      "x-supabase-access-token": session?.accessToken,
    },
  })

  return (
    <StreamContext.Provider value={{
      ...streamValue,
      processedEventsTimeline,
      historicalActivities,
      hasFinalizeEventOccurred,
      setProcessedEventsTimeline,
      setHistoricalActivities,
      setHasFinalizeEventOccurred,
      voiceStream
    }}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { agents, loading } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [audioAgentId, setAudioAgentId] = useQueryState("audioAgentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value || !agents.length) {
      return;
    }
    const defaultAgent = agents.find(isUserSpecifiedDefaultAgent);
    if (defaultAgent) {
      setValue(`${defaultAgent.assistant_id}:${defaultAgent.deploymentId}`);
    }
    const audioAgent = agents.find((agent) => agent.name === "podcast_agent");
    setAudioAgentId(audioAgent!.assistant_id);
  }, [agents]);

  const handleValueChange = (v: string) => {
    setValue(v);
    setOpen(false);
  };

  const handleStartChat = () => {
    if (!value) {
      toast.info("Please select an agent");
      return;
    }
    const [agentId_, deploymentId_] = value.split(":");
    setAgentId(agentId_);
    setDeploymentId(deploymentId_);
  };

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Open Agent Platform
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Open Agent Platform's chat! To continue, please select
              an agent to chat with.
            </p>
          </div>
          <div className="mt-4 mb-24 flex items-center justify-center gap-4">
            <AgentsCombobox
              agents={agents}
              agentsLoading={loading}
              value={value}
              setValue={(v) =>
                Array.isArray(v)
                  ? handleValueChange(v[0])
                  : handleValueChange(v)
              }
              open={open}
              setOpen={setOpen}
            />
            <Button onClick={handleStartChat}>Start Chat</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamSession
      agentId={agentId}
      deploymentId={deploymentId}
      audioAgentId={audioAgentId!}
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
