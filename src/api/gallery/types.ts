/**
 * Gallery image item
 */
export interface GalleryImage {
  /** Unique image ID */
  id: string;
  /** Replicate prediction ID */
  predictionId: string;
  /** R2 image URL */
  imageUrl: string;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Request parameters for fetching gallery
 */
export interface GalleryParams {
  /** Cursor for pagination (createdAt timestamp) */
  cursor?: string;
  /** Number of items to fetch (default: 12, max: 50) */
  limit?: number;
}

/**
 * Response type for /api/gallery endpoint
 */
export interface GalleryResponse {
  /** List of gallery images */
  images: GalleryImage[];
  /** Cursor for next page (null if no more) */
  nextCursor: string | null;
  /** Whether there are more results */
  hasMore: boolean;
}

/**
 * Error response type for gallery API
 */
export interface GalleryErrorResponse {
  error: string;
}
