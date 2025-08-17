"use client";

import * as React from "react";
import { Wrench, Bot, MessageCircle, Brain, AudioLines } from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./sidebar-header";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Chat",
      url: "/",
      icon: MessageCircle,
    },
    // {
    //   title: "Voice",
    //   url: "/voice",
    //   icon: AudioLines,
    // },
    {
      title: "Agents",
      url: "/agents",
      icon: Bot,
    },
    {
      title: "MCPs",
      url: "/mcps",
      icon: Wrench,
    },
    // {
    //   title: "Tools",
    //   url: "/tools",
    //   icon: Wrench,
    // },
    // {
    //   title: "Inbox",
    //   url: "/inbox",
    //   icon: Inbox,
    // },
    {
      title: "RAG",
      url: "/rag",
      icon: Brain,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SiteHeader />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
