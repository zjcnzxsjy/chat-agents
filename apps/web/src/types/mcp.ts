export type ConnectionType = "stdio" | "sse";

export interface StdioConfig {
  command: string;
  args: string[];
  transport: "stdio";
  env: Record<string, string>;
}

export interface SSEConfig {
  url: string;
  transport: "sse";
}

export type ServerConfig = StdioConfig | SSEConfig;

export type MCPServerStatus = "connecting" | "connected" | "disconnected" | "error";

export type MCPSSEServerItem = SSEConfig & {
  id: string;
  name: string;
  client?: any;
  status: MCPServerStatus;
  error?: any;
};

export type MCPStdioServerItem = StdioConfig & {
  id: string;
  name: string;
  client?: any;
  status: MCPServerStatus;
  error?: any;
};

export interface MCPServersConfig {
  mcpServersConfig: {
    [name: string]: ServerConfig
  }
}