import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Tool } from "@/types/tool";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MCPServerStatus, MCPSSEServerItem, MCPStdioServerItem, ServerConfig } from "@/types/mcp";
import { useLocalStorage } from "./use-localstorage";

export const CLIENT_NAME = "mcp-client";
export const CLIENT_VERSION = "1.0.0";
// Local storage key for saving agent state
export const STORAGE_KEY = "mcp-agent-state";

function getMCPUrlOrThrow() {
  const [savedConfigs, setSavedConfigs] = useLocalStorage<
    Record<string, ServerConfig>
  >(STORAGE_KEY, {});
  if (!process.env.NEXT_PUBLIC_MCP_SERVER_URL) {
    throw new Error("NEXT_PUBLIC_MCP_SERVER_URL is not defined");
  }

  if (process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED !== "true") {
    // Do not use proxy route, and use the URL directly
    const mcpUrl = new URL(process.env.NEXT_PUBLIC_MCP_SERVER_URL);
    mcpUrl.pathname = `${mcpUrl.pathname}/mcp`;
    return mcpUrl;
  }

  if (!process.env.NEXT_PUBLIC_BASE_API_URL) {
    throw new Error("NEXT_PUBLIC_BASE_API_URL is not defined");
  }

  const url = new URL(process.env.NEXT_PUBLIC_BASE_API_URL);
  url.pathname = `${url.pathname}/oap_mcp`;
  return url;
}

/**
 * Custom hook for interacting with the Model Context Protocol (MCP).
 * Provides functions to connect to an MCP server and list available tools.
 */
export default function useMCP({
  name,
  version,
}: {
  name: string;
  version: string;
}) {
  const [servers, setServers] = useState<(MCPSSEServerItem | MCPStdioServerItem)[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [cursor, setCursor] = useState("");
  const [savedConfigs, setSavedConfigs] = useLocalStorage<
    Record<string, ServerConfig>
  >(STORAGE_KEY, {});
  /**
   * Creates an MCP client and connects it to the specified server URL.
   * @param url - The URL of the MCP server.
   * @param options - Client identification options.
   * @param options.name - The name of the client.
   * @param options.version - The version of the client.
   * @returns A promise that resolves to the connected MCP client instance.
   */
  const createAndConnectMCPClient = async () => {
    const servers: (MCPSSEServerItem | MCPStdioServerItem)[] = []
    await Promise.all(
      Object.entries(savedConfigs).map(async ([name, server]) => {
        const config = {
          id: uuidv4(),
          name,
        }
        // const client = new Client({ name: name, version: version });
        if (server.transport === "sse") {
          // const transport = new StreamableHTTPClientTransport(new URL(server.url));
          
          try {
            // await client.connect(transport);
            servers.push({
              ...config,
              url: server.url,
              // client,
              status: "connected",
              error: undefined,
              transport: "sse",
            })
          } catch (e) {
            servers.push({
              ...config,
              url: server.url,
              status: "error",
              error: e,
              transport: "sse",
            })
          }
        } else if (server.transport === "stdio") {
          servers.push({
            ...config,
            status: "connected",
            error: undefined,
            command: server.command,
            args: server.args,
            transport: "stdio",
            env: server.env,
          })
        }
      })
    );
    setServers(servers);
  };

  const addServer = async (name: string, server: ServerConfig) => {
    const id = uuidv4();
    setServers(prev => [
      ...prev,
      { id, name, status: server.transport === "sse" ? "connecting" : "connected", ...server }
    ]);

    if (server.transport === "sse") {
      // 尝试连接
      try {
        const client = new Client({ name, version: "1.0.0" });
        const transport = new StreamableHTTPClientTransport(new URL(server.url));
        await client.connect(transport);
        setServers(prev =>
          prev.map(s =>
            s.id === id ? { ...s, client, status: "connected" } : s
          )
        );
      } catch (e) {
        setServers(prev =>
          prev.map(s =>
            s.id === id ? { ...s, status: "error", error: e } : s
          )
        );
      }
    }
    setSavedConfigs({
      ...savedConfigs,
      [name]: server,
    })
  }

  const removeServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
  }

  // /**
  //  * Connects to an MCP server and retrieves the list of available tools.
  //  * @param url - The URL of the MCP server.
  //  * @param options - Client identification options.
  //  * @param options.name - The name of the client.
  //  * @param options.version - The version of the client.
  //  * @returns A promise that resolves to an array of available tools.
  //  */
  // const getTools = async (nextCursor?: string): Promise<Tool[]> => {
  //   const mcp = await createAndConnectMCPClient();
  //   const tools = await mcp.listTools({ cursor: nextCursor });
  //   if (tools.nextCursor) {
  //     setCursor(tools.nextCursor);
  //   } else {
  //     setCursor("");
  //   }
  //   return tools.tools;
  // };

  // /**
  //  * Calls a tool on the MCP server.
  //  * @param name - The name of the tool.
  //  * @param version - The version of the tool. Optional.
  //  * @param args - The arguments to pass to the tool.
  //  * @returns A promise that resolves to the response from the tool.
  //  */
  // const callTool = async ({
  //   name,
  //   args,
  //   version,
  // }: {
  //   name: string;
  //   args: Record<string, any>;
  //   version?: string;
  // }) => {
  //   const mcp = await createAndConnectMCPClient();
  //   const response = await mcp.callTool({
  //     name,
  //     version,
  //     arguments: args,
  //   });
  //   return response;
  // };

  return {
    servers,
    // getTools,
    // callTool,
    createAndConnectMCPClient,
    addServer,
    removeServer,
    tools: [],
    // setTools,
    cursor,
  };
}
