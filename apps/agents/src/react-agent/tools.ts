import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { z } from "zod";
import Stream from "node:stream";

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

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

export async function getTools(mcpServersConfig: MCPServersConfig): Promise<StructuredToolInterface[]> {
  if (mcpServersConfig && Object.keys(mcpServersConfig).length === 0) {
    return [];
  }
  // Create client and connect to server
  const client = new MultiServerMCPClient({
    // Global tool configuration options
    // Whether to throw on errors if a tool fails to load (optional, default: true)
    throwOnLoadError: true,
    // Whether to prefix tool names with the server name (optional, default: true)
    prefixToolNameWithServerName: true,
    // Optional additional prefix for tool names (optional, default: "mcp")
    additionalToolNamePrefix: "mcp",

    // Server configuration
    mcpServers: mcpServersConfig,
  });

  return await client.getTools();
}

export async function createRAGTools(rag_url: string, collectionId: string, accessToken: string) {
  // 规范化 URL，移除末尾的斜杠
  let finalRagUrl = rag_url;
  if (finalRagUrl.endsWith("/")) {
    finalRagUrl = finalRagUrl.slice(0, -1);
  }
  const collectionEndpoint = new URL(`${finalRagUrl}/api/collections/${collectionId}`);

  try {
    const response = await fetch(collectionEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch collection metadata: ${response.status} ${response.statusText}`
      );
    }
    const { data: collectionData } = await response.json();

    // 步骤 2: 清理和准备工具的名称和描述
    const rawCollectionName = `tool_collection_${collectionData.name}`;

    // 清理名称，只允许字母数字、下划线和连字符
    let sanitizedName = rawCollectionName.replace(/[^a-zA-Z0-9_-]/g, "_");
    // 确保名称不为空，并且不超过64个字符
    const toolName = sanitizedName.slice(0, 64);

    const rawDescription = collectionData.metadata?.description;
    const toolDescription = rawDescription
      ? `Search your collection of documents for results semantically similar to the input query. Collection description: ${rawDescription}`
      : "Search your collection of documents for results semantically similar to the input query";

    // 步骤 3: 创建并返回一个 StructuredTool 实例
    const ragTool = tool(async({ query }) => {
      const queryParams = new URLSearchParams({
        collectionId,
        query,
        limit: "5",
      });
      const searchEndpoint = new URL(`${finalRagUrl}/api/collection/documents/search?${queryParams.toString()}`);

      try {
        const searchResponse = await fetch(searchEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!searchResponse.ok) {
          throw new Error(`Search failed with status: ${searchResponse.status}`);
        }
        const res = await searchResponse.json();
        const documents: Document[] = res.data

        // 将文档格式化为 XML 字符串
        let formattedDocs = "<all-documents>\n";
        for (const doc of documents) {
          const docId = doc.metadata.collectionId || "unknown";
          const content = doc.content || "";
          formattedDocs += `  <document id="${docId}">\n    ${content}\n  </document>\n`;
        }
        formattedDocs += "</all-documents>";
        return formattedDocs;
      } catch (e: any) {
        // 在工具执行失败时返回一个清晰的错误信息
        return `<all-documents>\n  <error>${e.message}</error>\n</all-documents>`;
      }
    }, {
      name: toolName,
      description: toolDescription,
      // 使用 Zod 定义工具的输入模式
      schema: z.object({
        query: z.string().describe("The search query to find relevant documents"),
      }),
    })

    return ragTool;
  } catch (error) {
    console.log('error', error)
    throw error;
  }
}
