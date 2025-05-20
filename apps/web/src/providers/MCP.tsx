import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import useMCP, { CLIENT_NAME, CLIENT_VERSION } from "../hooks/use-mcp";

type MCPContextType = ReturnType<typeof useMCP> & { loading: boolean };

const MCPContext = createContext<MCPContextType | null>(null);

export const MCPProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const mcpState = useMCP({
    name: CLIENT_NAME, version: CLIENT_VERSION
  });

  const firstRequestMade = useRef(false);
  const [loading, setLoading] = useState(false);

  const init = async () => {
    if (firstRequestMade.current) return;

    firstRequestMade.current = true;
    setLoading(true);
    try {
      await mcpState.createAndConnectMCPClient();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init()
  }, []);

  return (
    <MCPContext.Provider value={{ ...mcpState, loading }}>
      {children}
    </MCPContext.Provider>
  );
};

export const useMCPContext = () => {
  const context = useContext(MCPContext);
  if (context === null) {
    throw new Error("useMCPContext must be used within a MCPProvider");
  }
  return context;
};
