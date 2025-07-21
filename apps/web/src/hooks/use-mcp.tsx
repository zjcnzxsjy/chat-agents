import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Tool } from "@/types/tool";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MCPSSEServerItem, MCPStdioServerItem, ServerConfig } from "@/types/mcp";
import { useLocalStorage } from "./use-localstorage";

export const CLIENT_NAME = "mcp-client";
export const CLIENT_VERSION = "1.0.0";
// Local storage key for saving agent state
export const STORAGE_KEY = "mcp-agent-state";

function getMCPUrlOrThrow() {
  if (!process.env.NEXT_PUBLIC_SERVER_API_URL) {
    throw new Error("NEXT_PUBLIC_SERVER_API_URL is not defined");
  }

  const url = new URL(process.env.NEXT_PUBLIC_SERVER_API_URL);
  url.pathname = `${url.pathname}api/oap_mcp`;
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
        servers.push({
          ...config,
          ...server
        })
      })
    );
    setServers(servers);
  };

  const addServer = async (name: string, server: ServerConfig) => {
    const id = uuidv4();

    const mcpInfo = await fetch("/api/oap_mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [name]: server
      }),
    });
    const serverWithTools = await mcpInfo.json();

    // if (server.transport === "sse") {
    //   // 尝试连接
    //   try {
    //     const client = new Client({ name, version: "1.0.0" });
    //     const transport = new StreamableHTTPClientTransport(new URL(server.url));
    //     await client.connect(transport);
    //     setServers(prev =>
    //       prev.map(s =>
    //         s.id === id ? { ...s, client, status: "connected" } : s
    //       )
    //     );
    //   } catch (e) {
    //     setServers(prev =>
    //       prev.map(s =>
    //         s.id === id ? { ...s, status: "error", error: e } : s
    //       )
    //     );
    //   }
    // }
    setServers(prev => [
      ...prev,
      { id, name, ...serverWithTools[name] }
    ])
    setSavedConfigs({
      ...savedConfigs,
      [name]: serverWithTools[name],
    })
  }

  const removeServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
  }

  return {
    servers,
    createAndConnectMCPClient,
    addServer,
    removeServer,
  };
}
