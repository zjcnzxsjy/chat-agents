import { v4 as uuidv4 } from "uuid";
import { ReactNode, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "../providers/Stream";
import { Button } from "@/components/ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import {
  AssistantMessageLoading,
} from "@/components/messages/ai";
import { HumanMessage } from "@/components/messages/human";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { ArrowDown } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { toast } from "sonner";
import { ensureToolCallsHaveResponses } from "@/features/chat/utils/tool-responses";
import { DO_NOT_RENDER_ID_PREFIX } from "@/constants";
import { useAuthContext } from "@/providers/Auth";
import ChatInput from "@/components/ui/chat-input";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { AiMessage } from "./ai-message";
import researchSteps from "../utils/research-steps";
import { ActivityTimeline } from "@/components/messages/activity-time-line";

interface ThreadBlockProps {
  className?: string;
}

const defaultConfig = {
  queryGeneratorModel: "google-genai/gemini-2.5-flash-preview-05-20",
  reasoningModel: "google-genai/gemini-2.5-flash-preview-05-20",
  numberOfInitialQueries: 3,
  maxResearchLoops: 2,
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function ThreadBlock(props: ThreadBlockProps) {
  const { className } = props;
  const [threadId, setThreadId] = useQueryState("threadId");
  const [agentId] = useQueryState("agentId");
  const { getAgentConfig } = useConfigStore();
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);

  const { session } = useAuthContext();

  const stream = useStreamContext();

  const {
    messages,
    history,
    isLoading,
    processedEventsTimeline,
    historicalActivities,
    hasFinalizeEventOccurred,
    setProcessedEventsTimeline,
    setHistoricalActivities,
    setHasFinalizeEventOccurred,
    setActiveReportId,
  } = stream;

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  useEffect(() => {
    if (!messages.length) return;
    for (const message of messages) {
      if (message && message.type === "ai") {
        setFirstTokenReceived(true);
        const researchHistory = researchSteps(message, history);
        setHistoricalActivities((prev) => ({
          ...prev,
          [message.id!]: [...researchHistory],
        }));
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = (value: string) => {
    if (!agentId) return;
    setFirstTokenReceived(false);
    setProcessedEventsTimeline([]);
    setHasFinalizeEventOccurred(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: value,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
        config: {
          configurable: getAgentConfig(agentId),
        },
        metadata: {
          supabaseAccessToken: session?.accessToken,
        },
      },
    );
  };

  const handleSubmitEdit = (newMessage: Message, meta: any) => {
    if (!agentId) return;

    const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
    stream.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
        config: {
          configurable: getAgentConfig(agentId),
        },
        metadata: {
          supabaseAccessToken: session?.accessToken,
        },
      },
    );
  };

  const chatStarted = !!threadId;

  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)}>
      <StickToBottom className="relative flex-1 overflow-hidden">
        <StickyToBottomContent
          className={cn(
            "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
            !chatStarted && "mt-[25vh] flex flex-col items-stretch",
            chatStarted && "grid grid-rows-[1fr_auto]",
          )}
          contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
          content={
            <>
              {messages
                .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                .map((message, index) =>
                  message.type === "human" ? (
                    <HumanMessage
                      key={message.id || `${message.type}-${index}`}
                      message={message}
                      isLoading={isLoading}
                      thread={stream}
                      onSubmit={handleSubmitEdit}
                    />
                  ) : (
                    <AiMessage
                      key={message.id || `${message.type}-${index}`}
                      message={message}
                      isOverallLoading={isLoading}
                      isLastMessage={index === messages.length - 1}
                      liveActivity={processedEventsTimeline}
                      historicalActivity={historicalActivities[message.id!]}
                      onOpenResearch={(id) => setActiveReportId(id ?? null)}
                    />
                  ),
                )}
              {isLoading &&
                (messages.length === 0 ||
                  messages[messages.length - 1].type === "human") && (
                  <div className="flex items-start gap-3 mt-3">
                    {" "}
                    {/* AI message row structure */}
                    {processedEventsTimeline.length > 0 ? (
                      <div className="text-xs">
                        <ActivityTimeline
                          processedEvents={processedEventsTimeline}
                          isLoading={true}
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
            </>
          }
          footer={
            <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-white">
              {!chatStarted && (
                <div className="flex items-center gap-3">
                  <LangGraphLogoSVG className="h-8 flex-shrink-0" />
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Open Agent Platform
                  </h1>
                </div>
              )}

              <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

              <div className="bg-muted relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl border shadow-xs">
                <ChatInput
                  isLoading={isLoading}
                  threadId={threadId}
                  hasHideToolCalls={true}
                  hideToolCalls={hideToolCalls}
                  onSetHideToolCalls={setHideToolCalls}
                  onSubmit={handleSubmit}
                  onStop={() => stream.stop()}
                  onSetNewThreadId={() => setThreadId(null)}
                />
              </div>
            </div>
          }
        />
      </StickToBottom>
    </div>
  );
}
