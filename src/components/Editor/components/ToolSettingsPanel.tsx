import { useTranslation } from "react-i18next";
import { Lock, Unlock } from "lucide-react";
import type { EditorTool } from "../hooks/useEditorState";

interface ToolSettingsPanelProps {
  activeTool: EditorTool;
  blurRadius?: number;
  onBlurRadiusChange?: (value: number) => void;
  resizeWidth?: number;
  resizeHeight?: number;
  maintainAspectRatio?: boolean;
  onResizeWidthChange?: (value: number) => void;
  onResizeHeightChange?: (value: number) => void;
  onToggleAspectRatio?: () => void;
}

export function ToolSettingsPanel({
  activeTool,
  blurRadius,
  onBlurRadiusChange,
  resizeWidth,
  resizeHeight,
  maintainAspectRatio,
  onResizeWidthChange,
  onResizeHeightChange,
  onToggleAspectRatio,
}: ToolSettingsPanelProps) {
  const { t } = useTranslation();

  if (activeTool === "CROP" || !activeTool) {
    return null;
  }

  return (
    <div className="p-3 border-t border-gray-200 sm:p-4 lg:p-6 bg-gray-50">
      {activeTool === "BLUR" && blurRadius !== undefined && onBlurRadiusChange && (
        <div className="flex items-center justify-center w-full max-w-md gap-4 mx-auto">
          <label className="text-sm text-gray-600 whitespace-nowrap">
            Blur Radius:
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={blurRadius}
            onChange={(e) => onBlurRadiusChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-8 text-sm text-gray-500">{blurRadius}px</span>
        </div>
      )}

      {activeTool === "RESIZE" &&
        resizeWidth !== undefined &&
        resizeHeight !== undefined &&
        maintainAspectRatio !== undefined &&
        onResizeWidthChange &&
        onResizeHeightChange &&
        onToggleAspectRatio && (
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <input
              type="number"
              value={resizeWidth}
              onChange={(e) => onResizeWidthChange(Number(e.target.value))}
              className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded sm:w-20"
              min="1"
            />
            <span className="font-medium text-gray-400">×</span>
            <input
              type="number"
              value={resizeHeight}
              onChange={(e) => onResizeHeightChange(Number(e.target.value))}
              className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded sm:w-20"
              min="1"
            />
            <button
              type="button"
              onClick={onToggleAspectRatio}
              className={`p-1.5 rounded transition-colors ${
                maintainAspectRatio
                  ? "text-fuchsia-500 bg-fuchsia-50"
                  : "text-gray-400 bg-gray-100"
              }`}
              aria-label="Lock aspect ratio"
              title={
                maintainAspectRatio
                  ? t("editor.unlockAspectRatio")
                  : t("editor.lockAspectRatio")
              }
            >
              {maintainAspectRatio ? (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Unlock className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        )}
    </div>
  );
}
