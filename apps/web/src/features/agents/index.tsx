import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "./components/page-header";
import { TemplatesList } from "./components/templates-list";
import { AgentDashboard } from "./components/agent-dashboard";

export default function AgentsInterfaceV2() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Agents"
        description="Manage your agents across different templates"
        action={null}
      />

      <Tabs
        defaultValue="chat-agents"
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="chat-agents">Chat Agents</TabsTrigger>
          <TabsTrigger value="advanced-agents">Advanced Agents</TabsTrigger>
        </TabsList>

        <TabsContent
          value="chat-agents"
          className="mt-6"
        >
          <Suspense fallback={<p>Loading...</p>}>
            <TemplatesList />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="advanced-agents"
          className="mt-6"
        >
          <Suspense fallback={<p>Loading...</p>}>
            <AgentDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
