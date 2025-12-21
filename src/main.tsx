import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import "./i18n";

import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";
import { initAnalytics, trackPageView } from "./utils/analytics";

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

// 🚀 렌더링을 막지 않도록 브라우저가 한가할 때(Idle) 분석 툴 로드 시작
const startAnalytics = () => {
  if ("requestIdleCallback" in window) {
    (window as Window & typeof globalThis).requestIdleCallback(() => {
      initAnalytics();
    });
  } else {
    // Safari 등 미지원 브라우저 폴백
    setTimeout(() => {
      initAnalytics();
    }, 2000); // 2초 뒤 로드
  }
};

startAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
