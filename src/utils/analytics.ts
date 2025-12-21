import ReactGA from "react-ga4";

// GA Measurement ID - should be set in environment variables
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics
 */
export function initGA() {
  if (!GA_MEASUREMENT_ID) {
    console.warn("Google Analytics Measurement ID not found");
    return;
  }

  ReactGA.initialize(GA_MEASUREMENT_ID, {
    gtagOptions: {
      send_page_view: false, // We'll send page views manually
    },
  });
}

/**
 * Track page views
 */
export function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID) return;

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

  // Navigation events
  EDITOR_OPEN: "editor_open",
  EDITOR_CLOSE: "editor_close",
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
export function trackEvent({ category, action, label, value, ...rest }: EventParams) {
  if (!GA_MEASUREMENT_ID) return;

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
