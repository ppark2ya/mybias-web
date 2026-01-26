// GA Measurement ID - should be set in environment variables
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
// MS Clarity ID - should be set in environment variables
const CLARITY_ID = import.meta.env.VITE_CLARITY_ID;

const isProduction = import.meta.env.PROD;
let isInitialized = false;

/**
 * GA4와 Clarity를 비동기로 초기화합니다.
 * 이 함수가 호출되기 전까지는 라이브러리 파일(JS)을 다운로드하지 않습니다.
 */
export async function initAnalytics() {
  // 1. 개발 환경이거나 이미 초기화됐다면 중단
  if (!isProduction || isInitialized) return;

  try {
    // 2. 라이브러리들을 병렬로 동적 임포트 (Code Splitting)
    const [ReactGA, { clarity }] = await Promise.all([
      import("react-ga4"),
      import("react-microsoft-clarity"),
    ]);

    // 3. GA4 초기화
    if (GA_MEASUREMENT_ID) {
      ReactGA.default.initialize(GA_MEASUREMENT_ID, {
        gtagOptions: {
          send_page_view: false, // 수동 전송 모드
        },
      });
    }

    // 4. Clarity 초기화
    if (CLARITY_ID) {
      clarity.init(CLARITY_ID);
    }

    isInitialized = true;
    console.log("Analytics initialized dynamically");
  } catch (error) {
    console.error("Failed to load analytics:", error);
  }
}

/**
 * Track page views
 */
export async function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID || !isProduction) return;

  // 혹시 초기화가 안 되었다면 먼저 초기화 시도
  if (!isInitialized) {
    await initAnalytics();
  }

  const ReactGA = (await import("react-ga4")).default;
  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title,
  });
}

/**
 * Event categories for the app
 */
export const EventCategory = {
  EDITOR: "editor",
  FILE: "file",
  AI: "ai",
  NAVIGATION: "navigation",
  AUTH: "auth",
  USER: "user",
  GALLERY: "gallery",
  SHARE: "share",
} as const;

/**
 * Event actions for tracking
 */
export const EventAction = {
  // File events
  FILE_UPLOAD: "file_upload",
  FILE_DOWNLOAD: "file_download",

  // Editor tool events
  TOOL_SELECT: "tool_select",
  TOOL_APPLY: "tool_apply",
  UNDO: "undo",
  REDO: "redo",

  // AI events
  AI_ENHANCE_START: "ai_enhance_start",
  AI_ENHANCE_SUCCESS: "ai_enhance_success",
  AI_ENHANCE_FAIL: "ai_enhance_fail",
  MAGIC_ERASER_START: "magic_eraser_start",
  MAGIC_ERASER_SUCCESS: "magic_eraser_success",
  MAGIC_ERASER_FAIL: "magic_eraser_fail",

  // Navigation events
  EDITOR_OPEN: "editor_open",
  EDITOR_CLOSE: "editor_close",

  // Auth events
  LOGIN_START: "login_start",
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",

  // User events
  LANGUAGE_CHANGE: "language_change",
  CHARGE_CLICK: "charge_click",

  // Gallery events
  IMAGE_VIEW: "image_view",
  IMAGE_VIEW_CLOSE: "image_view_close",
  GALLERY_LOAD_MORE: "gallery_load_more",

  // Share events
  SHARE_MODAL_OPEN: "share_modal_open",
  SHARE_MODAL_CLOSE: "share_modal_close",
  SHARE_CLICK: "share_click",
} as const;

type EventCategoryType = (typeof EventCategory)[keyof typeof EventCategory];
type EventActionType = (typeof EventAction)[keyof typeof EventAction];

interface EventParams {
  category: EventCategoryType;
  action: EventActionType;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

/**
 * Track custom events
 */
export async function trackEvent({
  category,
  action,
  label,
  value,
  ...rest
}: EventParams) {
  if (!GA_MEASUREMENT_ID || !isProduction || !isInitialized) return;

  const ReactGA = (await import("react-ga4")).default;
  ReactGA.event({
    category,
    action,
    label,
    value,
    ...rest,
  });
}

// Convenience functions for common events

/**
 * Track file upload event
 */
export function trackFileUpload(fileCount: number, totalSize: number) {
  trackEvent({
    category: EventCategory.FILE,
    action: EventAction.FILE_UPLOAD,
    label: `${fileCount} files`,
    value: fileCount,
    file_count: fileCount,
    total_size_kb: Math.round(totalSize / 1024),
  });
}

/**
 * Track file download event
 */
export function trackFileDownload() {
  trackEvent({
    category: EventCategory.FILE,
    action: EventAction.FILE_DOWNLOAD,
  });
}

/**
 * Track editor open event
 */
export function trackEditorOpen(fileCount: number) {
  trackEvent({
    category: EventCategory.NAVIGATION,
    action: EventAction.EDITOR_OPEN,
    value: fileCount,
  });
}

/**
 * Track editor close event
 */
export function trackEditorClose() {
  trackEvent({
    category: EventCategory.NAVIGATION,
    action: EventAction.EDITOR_CLOSE,
  });
}

/**
 * Track tool selection event
 */
export function trackToolSelect(toolName: string) {
  trackEvent({
    category: EventCategory.EDITOR,
    action: EventAction.TOOL_SELECT,
    label: toolName,
  });
}

/**
 * Track tool apply event
 */
export function trackToolApply(toolName: string) {
  trackEvent({
    category: EventCategory.EDITOR,
    action: EventAction.TOOL_APPLY,
    label: toolName,
  });
}

/**
 * Track undo event
 */
export function trackUndo() {
  trackEvent({
    category: EventCategory.EDITOR,
    action: EventAction.UNDO,
  });
}

/**
 * Track redo event
 */
export function trackRedo() {
  trackEvent({
    category: EventCategory.EDITOR,
    action: EventAction.REDO,
  });
}

/**
 * Track AI enhance start event
 */
export function trackAIEnhanceStart() {
  trackEvent({
    category: EventCategory.AI,
    action: EventAction.AI_ENHANCE_START,
  });
}

/**
 * Track AI enhance success event
 */
export function trackAIEnhanceSuccess(durationMs: number) {
  trackEvent({
    category: EventCategory.AI,
    action: EventAction.AI_ENHANCE_SUCCESS,
    value: Math.round(durationMs / 1000),
    duration_seconds: Math.round(durationMs / 1000),
  });
}

/**
 * Track AI enhance fail event
 */
export function trackAIEnhanceFail(errorMessage: string) {
  trackEvent({
    category: EventCategory.AI,
    action: EventAction.AI_ENHANCE_FAIL,
    label: errorMessage,
  });
}

/**
 * Track Magic Eraser start event
 */
export function trackMagicEraserStart() {
  trackEvent({
    category: EventCategory.AI,
    action: EventAction.MAGIC_ERASER_START,
  });
}

/**
 * Track Magic Eraser success event
 */
export function trackMagicEraserSuccess(durationMs: number) {
  trackEvent({
    category: EventCategory.AI,
    action: EventAction.MAGIC_ERASER_SUCCESS,
    value: Math.round(durationMs / 1000),
    duration_seconds: Math.round(durationMs / 1000),
  });
}

/**
 * Track Magic Eraser fail event
 */
export function trackMagicEraserFail(errorMessage: string) {
  trackEvent({
    category: EventCategory.AI,
    action: EventAction.MAGIC_ERASER_FAIL,
    label: errorMessage,
  });
}

/**
 * Track login start event
 */
export function trackLoginStart(method: "google" | "email" | "username") {
  trackEvent({
    category: EventCategory.AUTH,
    action: EventAction.LOGIN_START,
    label: method,
  });
}

/**
 * Track login success event
 */
export function trackLoginSuccess(method: "google" | "email" | "username") {
  trackEvent({
    category: EventCategory.AUTH,
    action: EventAction.LOGIN_SUCCESS,
    label: method,
  });
}

/**
 * Track logout event
 */
export function trackLogout() {
  trackEvent({
    category: EventCategory.AUTH,
    action: EventAction.LOGOUT,
  });
}

/**
 * Track language change event
 */
export function trackLanguageChange(language: string) {
  trackEvent({
    category: EventCategory.USER,
    action: EventAction.LANGUAGE_CHANGE,
    label: language,
  });
}

/**
 * Track charge button click event
 */
export function trackChargeClick() {
  trackEvent({
    category: EventCategory.USER,
    action: EventAction.CHARGE_CLICK,
  });
}

/**
 * Track image view event
 */
export function trackImageView() {
  trackEvent({
    category: EventCategory.GALLERY,
    action: EventAction.IMAGE_VIEW,
  });
}

/**
 * Track image view close event
 */
export function trackImageViewClose() {
  trackEvent({
    category: EventCategory.GALLERY,
    action: EventAction.IMAGE_VIEW_CLOSE,
  });
}

/**
 * Track gallery load more event
 */
export function trackGalleryLoadMore(page: number) {
  trackEvent({
    category: EventCategory.GALLERY,
    action: EventAction.GALLERY_LOAD_MORE,
    value: page,
  });
}

/**
 * Track share modal open event
 */
export function trackShareModalOpen() {
  trackEvent({
    category: EventCategory.SHARE,
    action: EventAction.SHARE_MODAL_OPEN,
  });
}

/**
 * Track share modal close event
 */
export function trackShareModalClose() {
  trackEvent({
    category: EventCategory.SHARE,
    action: EventAction.SHARE_MODAL_CLOSE,
  });
}

/**
 * Track share click event
 */
export function trackShareClick(platform: string) {
  trackEvent({
    category: EventCategory.SHARE,
    action: EventAction.SHARE_CLICK,
    label: platform,
  });
}
