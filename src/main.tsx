import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import "./i18n";

import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";
import { initGA, trackPageView } from "./utils/analytics";

// Initialize Google Analytics
initGA();

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Track page views on route change
router.subscribe("onResolved", ({ toLocation }) => {
  trackPageView(toLocation.pathname);
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
