export function processImage(
  img: HTMLImageElement,
  saturation: number,
  brightness: number,
): HTMLCanvasElement | HTMLImageElement {
  if (saturation === 0 && brightness === 0) return img
  const w = img.naturalWidth || img.width || 512
  const h = img.naturalHeight || img.height || 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const bFactor = 1 + brightness
  const sFactor = 1 + saturation
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * bFactor
    let g = d[i + 1] * bFactor
    let b = d[i + 2] * bFactor
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    d[i] = Math.min(255, Math.max(0, gray + sFactor * (r - gray)))
    d[i + 1] = Math.min(255, Math.max(0, gray + sFactor * (g - gray)))
    d[i + 2] = Math.min(255, Math.max(0, gray + sFactor * (b - gray)))
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}
