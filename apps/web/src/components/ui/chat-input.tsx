import { ComponentProps, useState, FormEvent, ReactNode } from "react";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { LoaderCircle, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ChatInputProps {
  className?: string;
  onSubmit?: (value: string) => void;
  isLoading: boolean;
  threadId: string | null;
  hasHideToolCalls?: boolean;
  hideToolCalls?: boolean;
  onSetHideToolCalls?: (hideToolCalls: boolean) => void;
  onSetNewThreadId?: (threadId: string | null) => void;
  onStop?: () => void;
  placeholder?: string;
}

function ChatInput(props: ChatInputProps): ReactNode {
  const {
    onSubmit,
    isLoading,
    threadId,
    hasHideToolCalls = false,
    hideToolCalls = false,
    onSetHideToolCalls,
    onSetNewThreadId,
    onStop,
    placeholder = "Type your message...",
  } = props;
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit?.(input);
    setInput("");
  }

  const chatStarted = !!threadId;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !e.metaKey &&
            !e.nativeEvent.isComposing
          ) {
            e.preventDefault();
            const el = e.target as HTMLElement | undefined;
            const form = el?.closest("form");
            form?.requestSubmit();
          }
        }}
        placeholder={placeholder}
        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
      />

      <div className="flex items-center justify-between p-2 pt-4">
        <div>
          <div className="flex items-center space-x-2">
            {chatStarted && (
              <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="New thread"
                variant="ghost"
                onClick={() => onSetNewThreadId?.(null)}
              >
                <SquarePen className="size-5" />
              </TooltipIconButton>
            )}

            {hasHideToolCalls && (
              <>
                <Switch
                  id="render-tool-calls"
                  checked={hideToolCalls ?? false}
                  onCheckedChange={onSetHideToolCalls}
                />
                <Label
                  htmlFor="render-tool-calls"
                  className="text-sm text-gray-600"
                >
                  Hide Tool Calls
                </Label>
              </>
            )}
              
          </div>
        </div>
        {isLoading ? (
          <Button
            key="stop"
            onClick={() => onStop?.()}
          >
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cancel
          </Button>
        ) : (
          <Button
            type="submit"
            className="shadow-md transition-all"
            disabled={isLoading || !input.trim()}
          >
            Send
          </Button>
        )}
      </div>
    </form>
  );
}

export default ChatInput;