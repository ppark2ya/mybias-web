import { useRef, useState, useEffect, useMemo } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";

export interface MaskCanvasRef {
  /** Export mask as base64 PNG (black background, white strokes) */
  exportMask: () => Promise<string>;
  /** Clear all strokes */
  clearCanvas: () => void;
  /** Undo last stroke */
  undo: () => void;
  /** Redo last undone stroke */
  redo: () => void;
  /** Check if canvas has any strokes */
  hasStrokes: () => boolean;
}

interface MaskCanvasProps {
  /** Background image URL to draw on */
  imageUrl: string;
  /** Original image width */
  imageWidth: number;
  /** Original image height */
  imageHeight: number;
  /** Brush size in pixels */
  brushSize?: number;
  /** Callback when strokes change */
  onStrokesChange?: (hasStrokes: boolean) => void;
  /** Ref to access canvas methods */
  ref?: React.Ref<MaskCanvasRef>;
}

export const MaskCanvas = ({
  ref,
  imageUrl,
  imageWidth,
  imageHeight,
  brushSize = 30,
  onStrokesChange,
}: MaskCanvasProps) => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeCount, setStrokeCount] = useState(0);

  // Notify parent when strokes change
  useEffect(() => {
    onStrokesChange?.(strokeCount > 0);
  }, [strokeCount, onStrokesChange]);

  // Expose methods via ref
  const refValue = useMemo(
    () => ({
      exportMask: async () => {
        if (!canvasRef.current) {
          throw new Error("Canvas not initialized");
        }

        // Get the sketch paths data
        const paths = await canvasRef.current.exportPaths();

        // Create a canvas with the original image dimensions
        const canvas = document.createElement("canvas");
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Fill with black background (areas to keep)
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, imageWidth, imageHeight);

        // Get the displayed canvas dimensions
        const displayCanvas = canvasRef.current;
        const exportedSvg = await displayCanvas.exportSvg();

        // Parse SVG to get actual canvas dimensions
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(exportedSvg, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");
        const containerWidth = svgElement
          ? parseFloat(svgElement.getAttribute("width") || "0")
          : 0;
        const containerHeight = svgElement
          ? parseFloat(svgElement.getAttribute("height") || "0")
          : 0;

        // Calculate object-contain rendering dimensions and offset
        // This accounts for the fact that the background image uses object-contain
        // which maintains aspect ratio and centers the image with possible padding
        const containerAspect = containerWidth / containerHeight;
        const imageAspect = imageWidth / imageHeight;

        let renderedWidth: number;
        let renderedHeight: number;
        let offsetX: number;
        let offsetY: number;

        if (imageAspect > containerAspect) {
          // Image is wider - fits horizontally, padding top/bottom
          renderedWidth = containerWidth;
          renderedHeight = containerWidth / imageAspect;
          offsetX = 0;
          offsetY = (containerHeight - renderedHeight) / 2;
        } else {
          // Image is taller - fits vertically, padding left/right
          renderedHeight = containerHeight;
          renderedWidth = containerHeight * imageAspect;
          offsetX = (containerWidth - renderedWidth) / 2;
          offsetY = 0;
        }

        // Calculate scale from rendered image to original image
        const scaleX = imageWidth / renderedWidth;
        const scaleY = imageHeight / renderedHeight;

        // Mask enhancement settings
        const MASK_DILATION_PX = 10; // Expand mask by this many pixels
        const MASK_BLUR_PX = 8; // Apply gaussian blur for smooth edges

        // Draw white strokes (areas to erase) with dilation
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const pathData of paths) {
          if (pathData.paths.length === 0) continue;

          // Add dilation to line width for expanded mask coverage
          const baseLineWidth =
            (pathData.strokeWidth || brushSize) * Math.max(scaleX, scaleY);
          ctx.lineWidth = baseLineWidth + MASK_DILATION_PX * 2;
          ctx.beginPath();

          const firstPoint = pathData.paths[0];
          // Transform coordinates: subtract offset, then scale to original image size
          const startX = (firstPoint.x - offsetX) * scaleX;
          const startY = (firstPoint.y - offsetY) * scaleY;
          ctx.moveTo(startX, startY);

          for (let i = 1; i < pathData.paths.length; i++) {
            const point = pathData.paths[i];
            const x = (point.x - offsetX) * scaleX;
            const y = (point.y - offsetY) * scaleY;
            ctx.lineTo(x, y);
          }

          ctx.stroke();
        }

        // Apply gaussian blur for smooth mask edges
        const blurredCanvas = document.createElement("canvas");
        blurredCanvas.width = imageWidth;
        blurredCanvas.height = imageHeight;
        const blurCtx = blurredCanvas.getContext("2d");

        if (!blurCtx) {
          throw new Error("Failed to get blur canvas context");
        }

        // Apply blur filter and draw the mask
        blurCtx.filter = `blur(${MASK_BLUR_PX}px)`;
        blurCtx.drawImage(canvas, 0, 0);

        // Export as base64 PNG
        return blurredCanvas.toDataURL("image/png");
      },

      clearCanvas: () => {
        canvasRef.current?.clearCanvas();
        setStrokeCount(0);
      },

      undo: () => {
        canvasRef.current?.undo();
        setStrokeCount((prev) => Math.max(0, prev - 1));
      },

      redo: () => {
        canvasRef.current?.redo();
        setStrokeCount((prev) => prev + 1);
      },

      hasStrokes: () => strokeCount > 0,
    }),
    [canvasRef, strokeCount, imageWidth, imageHeight, brushSize]
  );

  // Assign methods to ref
  useEffect(() => {
    if (!ref) return;

    if ("current" in ref) {
      ref.current = refValue;
    } else if (typeof ref === "function") {
      ref(refValue);
    }
  }, [ref, refValue]);

  const handleStroke = () => {
    setStrokeCount((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full">
      {/* Background image */}
      <img
        src={imageUrl}
        alt="Background"
        className="absolute inset-0 object-contain w-full h-full pointer-events-none"
        draggable={false}
      />

      {/* Drawing canvas overlay */}
      <div className="absolute inset-0">
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={brushSize}
          strokeColor="rgba(255, 100, 100, 0.6)"
          canvasColor="transparent"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "0",
          }}
          onStroke={handleStroke}
        />
      </div>
    </div>
  );
};

MaskCanvas.displayName = "MaskCanvas";

export default MaskCanvas;
