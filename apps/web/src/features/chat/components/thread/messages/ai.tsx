import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext, VoiceStreamContextType } from "@/features/chat/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "@/features/chat/utils/content-string";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "@/components/ui/markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { useQueryState, parseAsBoolean } from "nuqs";
import { ActivityTimeline, ProcessedEvent } from "./activity-time-line";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
  isLastMessage = false,
  liveActivity,
  historicalActivity,
  voiceStream
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
  isLastMessage?: boolean;
  liveActivity?: ProcessedEvent[];
  historicalActivity?: ProcessedEvent[];
  voiceStream?: VoiceStreamContextType
}) {
  console.log("message", message);
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );

  const thread = useStreamContext();
  const meta = message ? thread.getMessagesMetadata(message) : undefined;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";
  // Determine which activity events to show and if it's for a live loading message
  const activityForThisBubble =
    isLastMessage && isLoading ? liveActivity : historicalActivity;
  const isLiveActivityForThisBubble = isLastMessage && isLoading;

  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div className="group mr-auto flex items-start gap-2">
      {isToolResult ? (
        <ToolResult message={message} />
      ) : (
        <div className="flex flex-col gap-2">
           {activityForThisBubble && activityForThisBubble.length > 0 && (
            <div className="mb-3 border-b border-gray-200 pb-3 text-xs">
              <ActivityTimeline
                processedEvents={activityForThisBubble}
                isLoading={isLiveActivityForThisBubble}
              />
            </div>
          )}
          
          {contentString.length > 0 && (
            <div className="py-1">
              <MarkdownText>{contentString}</MarkdownText>
            </div>
          )}

          {!hideToolCalls && (
            <>
              {(hasToolCalls && toolCallsHaveContents && (
                <ToolCalls toolCalls={message.tool_calls} />
              )) ||
                (hasAnthropicToolCalls && (
                  <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                )) ||
                (hasToolCalls && <ToolCalls toolCalls={message.tool_calls} />)}
            </>
          )}

          {message && (
            <CustomComponent
              message={message}
              thread={thread}
            />
          )}
          {/**
           * TODO: Support rendering interrupts.
           * Tracking issue: https://github.com/langchain-ai/open-agent-platform/issues/22
           */}
          {/* {isAgentInboxInterruptSchema(threadInterrupt?.value) &&
            (isLastMessage || hasNoAIOrToolMessages) && (
              <ThreadView interrupt={threadInterrupt.value} />
            )}
          {threadInterrupt?.value &&
          !isAgentInboxInterruptSchema(threadInterrupt.value) &&
          isLastMessage ? (
            <GenericInterruptView interrupt={threadInterrupt.value} />
          ) : null} */}
          <div
            className={cn(
              "mr-auto flex items-center gap-2 transition-opacity",
              "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            <BranchSwitcher
              branch={meta?.branch}
              branchOptions={meta?.branchOptions}
              onSelect={(branch) => thread.setBranch(branch)}
              isLoading={isLoading}
            />
            <CommandBar
              content={contentString}
              isLoading={isLoading}
              isAiMessage={true}
              voiceStream={voiceStream}
              handleRegenerate={() => handleRegenerate(parentCheckpoint)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}
