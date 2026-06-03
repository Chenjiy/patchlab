import { EngineNode } from '../core/Node'
import { processImage } from '../../utils/imageProcessing'

export class PatternFillNode extends EngineNode {
  private rawImage: HTMLImageElement | null = null
  private processedImage: HTMLImageElement | HTMLCanvasElement | null = null
  private imageUrl = ''
  private loading = false

  tileSize = 80
  textureOffsetX = 0
  textureOffsetY = 0
  textureRotation = 0
  saturation = 0
  brightness = 0
  onImageLoaded: (() => void) | null = null

  constructor(id: string) {
    super(id)
  }

  setImage(url: string) {
    if (this.imageUrl === url && this.rawImage) return
    this.imageUrl = url
    this.rawImage = null
    this.processedImage = null
    if (!url) return

    this.loading = true
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      this.rawImage = img
      this.processedImage = processImage(img, this.saturation, this.brightness)
      this.loading = false
      if (this.onImageLoaded) this.onImageLoaded()
    }
    img.onerror = () => {
      this.loading = false
    }
    img.src = url
  }

  reprocess() {
    if (!this.rawImage) return
    this.processedImage = processImage(this.rawImage, this.saturation, this.brightness)
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.processedImage) return

    const img = this.processedImage
    const imgW = (img as HTMLImageElement).naturalWidth || img.width || 512
    const imgH = (img as HTMLImageElement).naturalHeight || img.height || 512

    // Konva behavior: fillPatternScaleX = tileSize / 512
    // This means the image is drawn at (tileSize/512 * imgW) pixels wide
    const scale = this.tileSize / 512

    ctx.save()

    // Apply texture rotation around center
    if (this.textureRotation !== 0) {
      ctx.translate(this.width / 2, this.height / 2)
      ctx.rotate(this.textureRotation * Math.PI / 180)
      ctx.translate(-this.width / 2, -this.height / 2)
    }

    // Tile the image manually to handle offset correctly
    const scaledW = imgW * scale
    const scaledH = imgH * scale
    if (scaledW < 1 || scaledH < 1) { ctx.restore(); return }

    // Compute starting offset (Konva uses negative offset as positive shift)
    const offX = -(this.textureOffsetX % scaledW)
    const offY = -(this.textureOffsetY % scaledH)
    const startX = offX - scaledW
    const startY = offY - scaledH

    // Extend drawing area for rotation
    const extra = this.textureRotation !== 0 ? Math.max(this.width, this.height) * 0.5 : 0

    for (let y = startY - extra; y < this.height + extra; y += scaledH) {
      for (let x = startX - extra; x < this.width + extra; x += scaledW) {
        ctx.drawImage(img, x, y, scaledW, scaledH)
      }
    }

    ctx.restore()
  }

  get isReady(): boolean {
    return !!this.processedImage
  }
}
