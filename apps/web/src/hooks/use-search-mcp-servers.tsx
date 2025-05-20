import { MCPSSEServerItem, MCPStdioServerItem } from "@/types/mcp";
import _, { debounce } from "lodash";
import { useState, useMemo } from "react";

export function useSearchMCPServers(
  servers: (MCPSSEServerItem | MCPStdioServerItem)[],
) {
  const [mcpSearchTerm, setMcpSearchTerm] = useState("");

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setMcpSearchTerm(value), 200),
    [],
  );

  // Filter tools based on the search term
  const filteredMcpServers = useMemo(() => {
    if (!mcpSearchTerm) return servers;
    return servers.filter((server) => {
      return (
        _.startCase(server.name)
          .toLowerCase()
          .includes(mcpSearchTerm.toLowerCase()) ||
        server.name.toLowerCase().includes(mcpSearchTerm.toLowerCase())
      );
    });
  }, [servers, mcpSearchTerm]);

  const displayMcpServers = useMemo(() => {
    const result: (MCPSSEServerItem | MCPStdioServerItem)[] = [];

    // First add all pre-selected tools that match the search term (if any)
    filteredMcpServers.forEach((server) => {
      result.push(server);
    });

    return result;
  }, [filteredMcpServers]);

  return {
    mcpSearchTerm,
    debouncedSetSearchTerm,
    filteredMcpServers,
    displayMcpServers,
  };
}
