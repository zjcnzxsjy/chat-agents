import { getDeployments } from "@/lib/environment/deployments";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { useStream } from "@langchain/langgraph-sdk/react";
import { useEffect } from "react";

export interface TTSOutput {
  audioData: string; // base64 encoded audio data
  mimeType: string;
  size: number;
}

export type StateType = { 
  researchText: string;
  ttsOutput?: TTSOutput;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: StateType;
  }
>;

export const useVoice = () => {
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();
  console.log("agents", agents);

  useEffect(() => {

  }, [])
  const podcastAgent = agents.find((agent) => agent.name === "podcast_agent");
  if (!podcastAgent) {
    return null
  }
  const podcastAgentId = podcastAgent.assistant_id;
  const podcasrAgentDeploymentId = podcastAgent.deploymentId;

  const deployment = getDeployments().find((d) => d.id === podcasrAgentDeploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${podcasrAgentDeploymentId} not found`);
  }

  const streamValue = useTypedStream({
    apiUrl: deployment.deploymentUrl,
    assistantId: podcastAgentId,
    threadId: null,
    defaultHeaders: {
      Authorization: `Bearer ${session?.accessToken}`,
      "x-supabase-access-token": session?.accessToken,
    },
  });

  return streamValue;
  
}