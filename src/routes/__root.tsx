import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy } from "react";
import { Toaster } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import NotFound from "../components/NotFound";

// 1. 배포 환경(production)이 아닐 때만 Devtools를 로드하도록 설정
const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null // 배포 시에는 아무것도 렌더링하지 않음 (null)
  : lazy(() =>
    // 개발 모드에서만 패키지를 로딩함 (번들 사이즈 감소 효과)
    import("@tanstack/router-devtools").then((res) => ({
      default: res.TanStackRouterDevtools,
      // 예전 버전의 경우: default: res.TanStackRouterDevtoolsPanel
    }))
  );

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster
        position="top-center"
        richColors
        duration={4000}
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties
        }
      />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: NotFound,
});
