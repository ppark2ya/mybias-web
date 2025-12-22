interface CropOverlayProps {
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent, isResize: boolean) => void;
  onTouchStart: (e: React.TouchEvent, isResize: boolean) => void;
}

export function CropOverlay({ style, onMouseDown, onTouchStart }: CropOverlayProps) {
  return (
    <div
      className="absolute border-2 cursor-move border-white bg-black/20 touch-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
      style={style}
      onMouseDown={(e) => onMouseDown(e, false)}
      onTouchStart={(e) => onTouchStart(e, false)}
    >
      {/* Corner resize handles - L-shaped brackets */}
      {/* Top-left */}
      <div
        className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize md:w-8 md:h-8"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, true);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStart(e, true);
        }}
      >
        <div className="absolute top-0 left-0 w-5 h-[3px] bg-white -translate-x-[2px] -translate-y-[2px]" />
        <div className="absolute top-0 left-0 w-[3px] h-5 bg-white -translate-x-[2px] -translate-y-[2px]" />
      </div>
      {/* Top-right */}
      <div
        className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize md:w-8 md:h-8"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, true);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStart(e, true);
        }}
      >
        <div className="absolute top-0 right-0 w-5 h-[3px] bg-white translate-x-[2px] -translate-y-[2px]" />
        <div className="absolute top-0 right-0 w-[3px] h-5 bg-white translate-x-[2px] -translate-y-[2px]" />
      </div>
      {/* Bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize md:w-8 md:h-8"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, true);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStart(e, true);
        }}
      >
        <div className="absolute bottom-0 left-0 w-5 h-[3px] bg-white -translate-x-[2px] translate-y-[2px]" />
        <div className="absolute bottom-0 left-0 w-[3px] h-5 bg-white -translate-x-[2px] translate-y-[2px]" />
      </div>
      {/* Bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize md:w-8 md:h-8"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, true);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStart(e, true);
        }}
      >
        <div className="absolute bottom-0 right-0 w-5 h-[3px] bg-white translate-x-[2px] translate-y-[2px]" />
        <div className="absolute bottom-0 right-0 w-[3px] h-5 bg-white translate-x-[2px] translate-y-[2px]" />
      </div>
    </div>
  );
}
