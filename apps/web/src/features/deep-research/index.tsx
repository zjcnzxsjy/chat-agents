"use client";

import { useMemo, ReactNode } from "react";
import { StreamProvider } from "./providers/Stream";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import { ThreadBlock } from "./components/thread-block";
import { ResearchBlock } from "./components/research-block";
export default function Page(): ReactNode {
  const [threadId] = useQueryState("threadId");
  // const doubleColumnMode = useMemo(
  //   () => threadId !== null,
  //   [threadId],
  // );
  const doubleColumnMode = true;

  return (
    <StreamProvider>
      <div
        className={cn(
          "flex h-[calc(100vh_-_4rem)] justify-center-safe overflow-x-hidden",
          doubleColumnMode && "gap-8",
        )}
      >
        <ThreadBlock
          className={cn(
            "shrink-0 transition-all duration-300 ease-out",
            !doubleColumnMode &&
              `w-[768px] translate-x-[min(max(calc((100vw-538px)*0.75),575px)/2,960px/2)]`,
            doubleColumnMode && `w-[538px]`,
          )}
        />
        <ResearchBlock
          className={cn(
            "w-[min(max(calc((100vw-538px)*0.75),575px),960px)] pb-4 transition-all duration-300 ease-out box-border",
            !doubleColumnMode && "scale-0",
            doubleColumnMode && "",
          )}
          researchId={threadId}
        />
      </div>
    </StreamProvider>
  )
}