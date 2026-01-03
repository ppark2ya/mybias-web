interface ImageSkeletonProps {
  count?: number;
}

export function ImageSkeleton({ count = 6 }: ImageSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative aspect-square rounded-xl overflow-hidden bg-gray-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
        </div>
      ))}
    </>
  );
}
