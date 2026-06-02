/**
 * Image processing service.
 * Current: browser Canvas-based basic processing.
 * Future: swap out methods for AI backend calls.
 */

export interface ProcessedFabric {
  originalDataUrl: string
  processedDataUrl: string
  tileDataUrl: string
}

/**
 * Prepare a fabric photo for the crop tool.
 * Only downscales very large images for canvas performance; does NOT crop or tile.
 * The actual square crop is done interactively in CropTool.tsx.
 */
export async function processFabricImage(file: File): Promise<ProcessedFabric> {
  const originalDataUrl = await fileToDataUrl(file)
  const processedDataUrl = await resizeToFit(originalDataUrl, 900)
  const tileDataUrl = processedDataUrl
  return { originalDataUrl, processedDataUrl, tileDataUrl }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Downscale image to fit within maxSize on the longest side, preserving aspect ratio.
 * Modern browsers apply EXIF orientation automatically when drawing <img> to canvas.
 */
async function resizeToFit(dataUrl: string, maxSize: number): Promise<string> {
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  if (scale === 1) return dataUrl  // already small enough, skip re-encode
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.82)
}

// Stub API surface for future AI backend integration

/** Remove background from fabric image (future AI feature) */
export async function removeBackground(_dataUrl: string): Promise<string> {
  throw new Error('removeBackground: AI backend not connected yet')
}

/** Correct perspective distortion in fabric photo (future AI feature) */
export async function correctPerspective(_dataUrl: string): Promise<string> {
  throw new Error('correctPerspective: AI backend not connected yet')
}

/** Normalize lighting and color cast (future AI feature) */
export async function normalizeLighting(_dataUrl: string): Promise<string> {
  throw new Error('normalizeLighting: AI backend not connected yet')
}

/** Generate a seamless tileable texture (future AI feature) */
export async function generateSeamlessTexture(_dataUrl: string): Promise<string> {
  throw new Error('generateSeamlessTexture: AI backend not connected yet')
}
