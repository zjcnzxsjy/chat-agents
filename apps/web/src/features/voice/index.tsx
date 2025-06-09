"use client";

import React from "react";
import { StreamProvider } from "./providers/Stream";
import VoiceOnlyInterface from "./voice-interface";

export default function Page(): React.ReactNode {
  return (
    <StreamProvider>
      <VoiceOnlyInterface />
    </StreamProvider>
  )
}