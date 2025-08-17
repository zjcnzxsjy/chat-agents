"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskAgentCard } from "../task-agent-card";
import { CreateAgentDialog } from "../create-edit-agent-dialogs/create-agent-dialog";
import { useAgentsContext } from "@/providers/Agents";
import { getDeployments } from "@/lib/environment/deployments";
import { GraphGroup } from "../../types";
import { groupAgentsByGraphs } from "@/lib/agent-utils";
import _ from "lodash";
import { CHAT_AGENTS } from "../../const";

export function AgentDashboard() {
  const { agents, loading: agentsLoading } = useAgentsContext();
  const deployments = getDeployments();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const allGraphGroups: GraphGroup[] = useMemo(() => {
    if (agentsLoading) return [];
    const groups: GraphGroup[] = [];
    deployments.forEach((deployment) => {
      const agentsInDeployment = agents.filter(
        (agent) => agent.deploymentId === deployment.id,
      );
      const agentsGroupedByGraphs = groupAgentsByGraphs(agentsInDeployment);
      agentsGroupedByGraphs.forEach((agentGroup) => {
        if (agentGroup.length > 0) {
          const graphId = agentGroup[0].graph_id;
          groups.push({
            agents: agentGroup,
            deployment,
            graphId,
          });
        }
      });
    });
    return groups;
  }, [agents, deployments, agentsLoading]);

  const filteredAgents = useMemo(() => {
    // 1. Filter groups based on the graphFilter dropdown
    let groupsMatchingGraphFilter: GraphGroup[];

    groupsMatchingGraphFilter = allGraphGroups.filter(
      (group) => !CHAT_AGENTS.includes(group.graphId)
    );

    // 2. Get all agents from the groups that matched the graph filter
    const agentsInFilteredGroups = groupsMatchingGraphFilter.flatMap(
      (group) => group.agents,
    );

    // 3. Filter these agents based on the search query
    const lowerCaseQuery = searchQuery.toLowerCase();
    if (!lowerCaseQuery) {
      return agentsInFilteredGroups; // No search query, return all agents from filtered groups
    }

    return agentsInFilteredGroups.filter((agent) =>
      agent.name.toLowerCase().includes(lowerCaseQuery),
    );
  }, [allGraphGroups, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search agents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {filteredAgents.length}{" "}
          {filteredAgents.length === 1 ? "Agent" : "Agents"}
        </h2>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="animate-in fade-in-50 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-10 w-10" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No agents found</h2>
          <p className="text-muted-foreground mt-2 mb-8 text-center">
            We couldn't find any agents matching your search criteria. Try
            adjusting your filters or create a new agent.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <TaskAgentCard
              key={`agent-dashboard-${agent.assistant_id}`}
              agent={agent}
              showDeployment={true}
            />
          ))}
        </div>
      )}

      {/* TODO: Replace with EditAgentDialog */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
