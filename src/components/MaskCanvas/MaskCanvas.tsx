import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from "react";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas";

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
}

export const MaskCanvas = forwardRef<MaskCanvasRef, MaskCanvasProps>(
  ({ imageUrl, imageWidth, imageHeight, brushSize = 30, onStrokesChange }, ref) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [strokeCount, setStrokeCount] = useState(0);

    // Notify parent when strokes change
    useEffect(() => {
      onStrokesChange?.(strokeCount > 0);
    }, [strokeCount, onStrokesChange]);

    useImperativeHandle(ref, () => ({
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
        const displayWidth = svgElement ? parseFloat(svgElement.getAttribute("width") || "0") : 0;
        const displayHeight = svgElement ? parseFloat(svgElement.getAttribute("height") || "0") : 0;

        // Calculate scale factors
        const scaleX = displayWidth > 0 ? imageWidth / displayWidth : 1;
        const scaleY = displayHeight > 0 ? imageHeight / displayHeight : 1;

        // Draw white strokes (areas to erase)
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const pathData of paths) {
          if (pathData.paths.length === 0) continue;

          ctx.lineWidth = (pathData.strokeWidth || brushSize) * Math.max(scaleX, scaleY);
          ctx.beginPath();

          const firstPoint = pathData.paths[0];
          ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);

          for (let i = 1; i < pathData.paths.length; i++) {
            const point = pathData.paths[i];
            ctx.lineTo(point.x * scaleX, point.y * scaleY);
          }

          ctx.stroke();
        }

        // Export as base64 PNG
        return canvas.toDataURL("image/png");
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
    }));

    const handleStroke = () => {
      setStrokeCount((prev) => prev + 1);
    };

    return (
      <div className="relative w-full h-full">
        {/* Background image */}
        <img
          src={imageUrl}
          alt="Background"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
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
  }
);

MaskCanvas.displayName = "MaskCanvas";

export default MaskCanvas;
