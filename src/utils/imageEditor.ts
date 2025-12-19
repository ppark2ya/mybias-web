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
 * Load an image from a data URL
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
 * Convert a File to a data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert a data URL to a Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Crop an image
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

  return canvas.toDataURL('image/png')
}

/**
 * Apply blur effect to an image using CSS filter (GPU accelerated)
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

  return outputCanvas.toDataURL('image/png')
}

/**
 * Resize an image
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

  return canvas.toDataURL('image/png')
}

/**
 * Get image dimensions from a data URL
 */
export async function getImageDimensions(
  imageSrc: string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(imageSrc)
  return { width: img.width, height: img.height }
}

/**
 * Download an image from a data URL
 * Works on desktop and mobile browsers (Chrome, Safari, Edge, etc.)
 */
export async function downloadImage(
  dataURL: string,
  filename: string = 'edited-image.png'
): Promise<void> {
  const blob = dataURLToBlob(dataURL)

  // Check if Web Share API is available and can share files (mainly for mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: blob.type })
    const shareData = { files: [file] }

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        // User cancelled or share failed, fall back to download
        if ((error as Error).name === 'AbortError') {
          return // User cancelled, don't try fallback
        }
      }
    }
  }

  // Fallback: Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // For iOS Safari compatibility
  link.style.display = 'none'
  document.body.appendChild(link)

  // Trigger download
  link.click()

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}
