import { ActivityTimeline, ProcessedEvent } from "@/components/messages/activity-time-line";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Message } from "@langchain/langgraph-sdk";

interface AiMessageProps {
  message: Message;
  isOverallLoading: boolean;
  isLastMessage: boolean;
  liveActivity: ProcessedEvent[];
  historicalActivity: ProcessedEvent[];
  onOpenResearch?: (id: string | null) => void;
}

export function AiMessage(props: AiMessageProps) {
  const { message, isOverallLoading, isLastMessage, liveActivity, historicalActivity, onOpenResearch } = props;
  const activityForThisBubble =
    isLastMessage && isOverallLoading ? liveActivity : historicalActivity;
  const isLiveActivityForThisBubble = isLastMessage && isOverallLoading;

  return (
    <div className="group mr-auto flex items-start gap-2">
      <div className="flex flex-col">
        {activityForThisBubble && activityForThisBubble.length > 0 && (
          <>
            <div className="mb-3 pb-3 text-xs">
              <ActivityTimeline
                processedEvents={activityForThisBubble}
                isLoading={isLiveActivityForThisBubble}
              />
            </div>
            <Card>
              <CardHeader>Research</CardHeader>
              <CardFooter>
                <div className="flex justify-between items-center gap-2 w-full">
                  <section>Report generated</section>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 bg-white"
                    onClick={() => onOpenResearch?.(message.id ?? null)}
                  >
                    Open
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}