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
 * Apply blur effect to an image using StackBlur algorithm
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

  canvas.width = img.width
  canvas.height = img.height

  ctx.drawImage(img, 0, 0)

  // Apply CSS filter for blur
  ctx.filter = `blur(${options.radius}px)`
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none'

  // Alternative: Manual box blur for better compatibility
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const blurredData = applyBoxBlur(imageData, options.radius)
  ctx.putImageData(blurredData, 0, 0)

  return canvas.toDataURL('image/png')
}

/**
 * Simple box blur implementation
 */
function applyBoxBlur(imageData: ImageData, radius: number): ImageData {
  const { data, width, height } = imageData
  const output = new Uint8ClampedArray(data)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0
      let count = 0

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4
            r += data[idx]
            g += data[idx + 1]
            b += data[idx + 2]
            a += data[idx + 3]
            count++
          }
        }
      }

      const idx = (y * width + x) * 4
      output[idx] = r / count
      output[idx + 1] = g / count
      output[idx + 2] = b / count
      output[idx + 3] = a / count
    }
  }

  return new ImageData(output, width, height)
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
