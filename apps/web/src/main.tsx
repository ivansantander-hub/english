import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import { AuthProvider } from "./features/auth/AuthContext.js";
import "./index.css";
import { getStoredToken } from "./lib/auth-storage.js";
import { API_URL } from "./lib/config.js";
import { trpc } from "./lib/trpc.js";

function Root() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // This is a single learner's personal daily-use app, not a
          // multi-actor dashboard — nothing changes server-side while the
          // tab is unfocused, so refetching on focus only risks discarding
          // in-progress state (e.g. handing back a new random exercise).
          queries: { refetchOnWindowFocus: false },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
          headers: () => {
            const token = getStoredToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
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
