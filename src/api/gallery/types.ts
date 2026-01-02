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
 * Response type for /api/gallery endpoint
 */
export interface GalleryResponse {
  /** List of gallery images */
  images: GalleryImage[];
}

/**
 * Error response type for gallery API
 */
export interface GalleryErrorResponse {
  error: string;
}
