import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { ResearchReportBlock } from "./research-report-block";
import { useStreamContext } from "../providers/Stream";
import { Message } from "@langchain/langgraph-sdk";

interface ResearchBlockProps {
  className?: string;
  researchId: string | null;
}

export function ResearchBlock(props: ResearchBlockProps) {
  const { className } = props;

  const stream = useStreamContext();
  const { messages, activeReportId } = stream;


  const reportMessage = useMemo(() => {
    return messages.find((m) => m.id === activeReportId);
  }, [messages, activeReportId]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Card className={cn("relative h-full w-full pt-4 overflow-hidden gap-0", className)}>
        <CardHeader className="border-b-[1px] border-gray-200">Research</CardHeader>
        <CardContent className="flex-1 h-full  overflow-y-auto">
          <ResearchReportBlock message={reportMessage} />
        </CardContent>
      </Card>
    </div>
  )
}