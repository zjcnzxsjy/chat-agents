import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "@/components/ui/tool-search";
import { Button } from "@/components/ui/button";
import {
  ConfigField,
  ConfigFieldAgents,
  ConfigFieldRAG,
  ConfigFieldMcp,
} from "@/features/chat/components/configuration-sidebar/config-field";
import { useSearchTools } from "@/hooks/use-search-tools";
import { useMCPContext } from "@/providers/MCP";
import {
  ConfigurableFieldAgentsMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldUIMetadata,
} from "@/types/configurable";
import _ from "lodash";
import { useFetchPreselectedTools } from "@/hooks/use-fetch-preselected-tools";
import { useSearchMCPServers } from "@/hooks/use-search-mcp-servers";
import { Controller, useFormContext } from "react-hook-form";

export function AgentFieldsFormLoading() {
  return (
    <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`loading-${index}`}
          className="flex w-full flex-col items-start justify-start gap-2"
        >
          <Skeleton className="h-10 w-[85%]" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

interface AgentFieldsFormProps {
  configurations: ConfigurableFieldUIMetadata[];
  mcpConfigurations: ConfigurableFieldMCPMetadata[];
  agentId: string;
  ragConfigurations: ConfigurableFieldRAGMetadata[];
  agentsConfigurations: ConfigurableFieldAgentsMetadata[];
}

export function AgentFieldsForm({
  configurations,
  mcpConfigurations,
  agentId,
  ragConfigurations,
  agentsConfigurations,
}: AgentFieldsFormProps) {
  const form = useFormContext<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>();

  const { servers } = useMCPContext();
  const { mcpSearchTerm, debouncedSetSearchTerm, displayMcpServers } =
    useSearchMCPServers(servers);

  return (
    <div className="flex flex-col gap-8 overflow-y-auto py-4">
      <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
        <p className="text-lg font-semibold tracking-tight">Agent Details</p>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="oap_name"
            {...form.register("name")}
            placeholder="Emails Agent"
          />
        </div>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="oap_description"
            {...form.register("description")}
            placeholder="Agent that handles emails"
          />
        </div>
      </div>
      {configurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
            <p className="text-lg font-semibold tracking-tight">
              Agent Configuration
            </p>
            {configurations.map((c, index) => (
              <Controller
                key={`${c.label}-${index}`}
                control={form.control}
                name={`config.${c.label}`}
                render={({ field: { value, onChange } }) => (
                  <ConfigField
                    className="w-full"
                    id={c.label}
                    label={c.label}
                    type={
                      c.type === "boolean" ? "switch" : (c.type ?? "text")
                    }
                    description={c.description}
                    placeholder={c.placeholder}
                    options={c.options}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={value}
                    setValue={onChange}
                    agentId={agentId}
                  />
                )}
              />
            ))}
          </div>
        </>
      )}
      {mcpConfigurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
            <p className="text-lg font-semibold tracking-tight">Agent Tools</p>
            <Search
              onSearchChange={debouncedSetSearchTerm}
              placeholder="Search tools..."
              className="w-full"
            />
            <div className="max-h-[500px] w-full flex-1 overflow-y-auto rounded-md border-[1px] border-slate-200 px-4">
              {mcpConfigurations[0]?.label
                ? displayMcpServers.map((c, index) => (
                    <Controller
                      key={`mcp-${c.name}`}
                      control={form.control}
                      name={`config.${mcpConfigurations[0].label}`}
                      render={({ field: { value, onChange } }) => (
                        <ConfigFieldMcp
                          key={`${c.name}-${index}`}
                          id={c.id}
                          label={c.name}
                          agentId={agentId}
                          mcpId={mcpConfigurations[0]?.label}
                          className="border-b-[1px] py-4"
                          value={value}
                          setValue={onChange}
                        />
                      )}
                    />
                  ))
                : null}
              {displayMcpServers.length === 0 && mcpSearchTerm && (
                <p className="my-4 w-full text-center text-sm text-slate-500">
                  No mcp servers found matching "{mcpSearchTerm}".
                </p>
              )}
              {servers.length === 0 && !mcpSearchTerm && (
                <p className="my-4 w-full text-center text-sm text-slate-500">
                  No mcp servers available for this agent.
                </p>
              )}
            </div>
          </div>
        </>
      )}
      {ragConfigurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-lg font-semibold tracking-tight">Agent RAG</p>
            <Controller
              control={form.control}
              name={`config.${ragConfigurations[0].label}`}
              render={({ field: { value, onChange } }) => (
                <ConfigFieldRAG
                  id={ragConfigurations[0].label}
                  label={ragConfigurations[0].label}
                  agentId={agentId}
                  value={value}
                  setValue={onChange}
                />
              )}
            />
          </div>
        </>
      )}
      {agentsConfigurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-lg font-semibold tracking-tight">
              Supervisor Agents
            </p>
            <Controller
              control={form.control}
              name={`config.${agentsConfigurations[0].label}`}
              render={({ field: { value, onChange } }) => (
                <ConfigFieldAgents
                  id={agentsConfigurations[0].label}
                  label={agentsConfigurations[0].label}
                  agentId={agentId}
                  value={value}
                  setValue={onChange}
                />
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
