import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy } from "react";

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
      <TanStackRouterDevtools />
    </>
  ),
});
