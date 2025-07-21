import { StructuredToolInterface } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import Stream from "node:stream";

export type MCPStdioServerConfig = {
  command: string;
  args: string[];
  type?: "stdio" | undefined;
  transport?: "stdio" | undefined;
  env?: Record<string, string> | undefined;
  encoding?: string | undefined;
  stderr?: Stream | "overlapped" | "pipe" | "ignore" | "inherit" | undefined;
  cwd?: string | undefined;
  restart?: {
      enabled?: boolean | undefined;
      maxAttempts?: number | undefined;
      delayMs?: number | undefined;
  } | undefined;
}

export type MCPSSEServerConfig = {
  url: string;
  headers?: Record<string, string> | undefined;
  useNodeEventSource?: boolean | undefined;
  reconnect?: {
      enabled?: boolean | undefined;
      maxAttempts?: number | undefined;
      delayMs?: number | undefined;
  } | undefined;
} & ({
  transport: "sse";
} | {
  type: "sse";
})

export type MCPServersConfig = Record<string, MCPStdioServerConfig | MCPSSEServerConfig>

export async function getTools(mcpServersConfig: MCPServersConfig) {
  if (mcpServersConfig && Object.keys(mcpServersConfig).length === 0) {
    return [];
  }
  const res: Record<string, any> = {}

  for (const [name, config] of Object.entries(mcpServersConfig)) {
    if ('transport' in config && config.transport === 'stdio') {
      mcpServersConfig[name] = {
        ...config,
        env: {
          ...config.env,
          PATH: process.env.PATH!
        }
      }
    }
    // Create client and connect to server
    const client = new MultiServerMCPClient({
      // Global tool configuration options
      // Whether to throw on errors if a tool fails to load (optional, default: true)
      throwOnLoadError: true,
      // Whether to prefix tool names with the server name (optional, default: true)
      prefixToolNameWithServerName: true,
      // Optional additional prefix for tool names (optional, default: "mcp")
      additionalToolNamePrefix: "",

      // Server configuration
      mcpServers: {
        [name]: mcpServersConfig[name],
      },
    });

    const tools = await client.getTools();
    res[name] = {
      ...mcpServersConfig[name],
      tools: tools.map(tool => tool.name)
    }
  }

  return res;
}