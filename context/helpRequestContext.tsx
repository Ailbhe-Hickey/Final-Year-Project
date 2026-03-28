import React, { createContext, useContext, useState } from "react";

interface HelpRequestContextType {
  incomingRequestId: string | null;
  setIncomingRequestId: (id: string | null) => void;
}

const HelpRequestContext = createContext<HelpRequestContextType>({
  incomingRequestId: null,
  setIncomingRequestId: () => {},
});

export function HelpRequestProvider({ children }: { children: React.ReactNode }) {
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(null);

  return (
    <HelpRequestContext.Provider value={{ incomingRequestId, setIncomingRequestId }}>
      {children}
    </HelpRequestContext.Provider>
  );
}

export function useHelpRequest() {
  return useContext(HelpRequestContext);
}
