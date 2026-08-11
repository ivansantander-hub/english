import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import "./index.css";
import { API_URL } from "./lib/config.js";
import { trpc } from "./lib/trpc.js";

function Root() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: `${API_URL}/trpc` })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
