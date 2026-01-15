export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ResizeOptions {
  width: number
  height: number
  maintainAspectRatio?: boolean
}

export interface BlurOptions {
  radius: number
}

/**
 * Load an image from a URL (blob URL or data URL)
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Convert a File to a blob URL
 */
export function fileToBlobUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Convert a canvas to a blob URL
 */
export function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob))
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, 'image/png')
  })
}

/**
 * Convert a blob URL to a Blob
 */
export async function blobUrlToBlob(blobUrl: string): Promise<Blob> {
  const response = await fetch(blobUrl)
  return response.blob()
}

/**
 * Crop an image - returns blob URL
 */
export async function cropImage(
  imageSrc: string,
  cropArea: CropArea
): Promise<string> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = cropArea.width
  canvas.height = cropArea.height

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  )

  return canvasToBlobUrl(canvas)
}

/**
 * Apply blur effect to an image using CSS filter (GPU accelerated) - returns blob URL
 */
export async function blurImage(
  imageSrc: string,
  options: BlurOptions
): Promise<string> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Add padding to prevent edge artifacts from blur
  const padding = options.radius * 2
  canvas.width = img.width + padding * 2
  canvas.height = img.height + padding * 2

  // Apply blur filter (GPU accelerated)
  ctx.filter = `blur(${options.radius}px)`
  ctx.drawImage(img, padding, padding)

  // Create output canvas with original dimensions (crop out padding)
  const outputCanvas = document.createElement('canvas')
  const outputCtx = outputCanvas.getContext('2d')

  if (!outputCtx) {
    throw new Error('Failed to get output canvas context')
  }

  outputCanvas.width = img.width
  outputCanvas.height = img.height

  outputCtx.drawImage(
    canvas,
    padding, padding, img.width, img.height,
    0, 0, img.width, img.height
  )

  return canvasToBlobUrl(outputCanvas)
}

/**
 * Resize an image - returns blob URL
 */
export async function resizeImage(
  imageSrc: string,
  options: ResizeOptions
): Promise<string> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  let { width, height } = options

  if (options.maintainAspectRatio) {
    const aspectRatio = img.width / img.height
    if (width / height > aspectRatio) {
      width = height * aspectRatio
    } else {
      height = width / aspectRatio
    }
  }

  canvas.width = width
  canvas.height = height

  // Use better quality scaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(img, 0, 0, width, height)

  return canvasToBlobUrl(canvas)
}

/**
 * Get image dimensions from a URL (blob URL or data URL)
 */
export async function getImageDimensions(
  imageSrc: string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(imageSrc)
  return { width: img.width, height: img.height }
}

/**
 * Download an image from a blob URL
 * Works on desktop and mobile browsers (Chrome, Safari, Edge, etc.)
 */
export async function downloadImage(
  blobUrl: string,
  filename: string = 'edited-image.png'
): Promise<void> {
  // Create download link directly from blob URL
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename

  // For iOS Safari compatibility
  link.style.display = 'none'
  document.body.appendChild(link)

  // Trigger download
  link.click()

  // Cleanup link element (but not the blob URL - it may still be in use)
  setTimeout(() => {
    document.body.removeChild(link)
  }, 100)
}

/**
 * Revoke a blob URL to free memory
 */
export function revokeBlobUrl(blobUrl: string): void {
  if (blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl)
  }
}

/**
 * Convert external image URL to blob URL (for AI-generated images)
 */
export async function urlToBlobUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * Blend two images together using alpha compositing
 * Used for Pro Restore: blends Real-ESRGAN (skin texture) with CodeFormer (facial features)
 * @param imageA - First image URL (Real-ESRGAN result - skin texture)
 * @param imageB - Second image URL (CodeFormer result - facial features)
 * @param alpha - Blend ratio (0-1, 0.7 = 70% imageB, 30% imageA)
 * @returns Blob URL of blended image
 */
export async function blendImages(
  imageA: string,
  imageB: string,
  alpha: number = 0.7
): Promise<string> {
  // Load both images
  const [imgA, imgB] = await Promise.all([loadImage(imageA), loadImage(imageB)])

  // Use the larger dimensions (they should be the same after upscaling)
  const width = Math.max(imgA.width, imgB.width)
  const height = Math.max(imgA.height, imgB.height)

  // Create canvas for blending
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = width
  canvas.height = height

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Draw image A (Real-ESRGAN - skin texture) as base
  ctx.globalAlpha = 1 - alpha // 30% for Real-ESRGAN when alpha=0.7
  ctx.drawImage(imgA, 0, 0, width, height)

  // Blend image B (CodeFormer - facial features) on top
  ctx.globalAlpha = alpha // 70% for CodeFormer when alpha=0.7
  ctx.drawImage(imgB, 0, 0, width, height)

  // Reset alpha
  ctx.globalAlpha = 1

  return canvasToBlobUrl(canvas)
}
