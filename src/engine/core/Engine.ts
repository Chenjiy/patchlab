import { GroupNode, EngineNode } from './Node'
import type { ViewportState, Point } from './types'
import {
  getDevicePixelRatio,
  requestFrame,
  cancelFrame,
  applyCanvasDisplaySize,
  setPlatformCanvas,
} from '../platform'

export class CanvasEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private canvas: HTMLCanvasElement | null = null
  private _width = 0
  private _height = 0
  private _dpr = 1
  private dirty = true
  private rafId = 0

  seamLayer: GroupNode = new GroupNode('seam-layer')
  clippedLayer: GroupNode = new GroupNode('clipped-layer')
  overlayLayer: GroupNode = new GroupNode('overlay-layer')

  clipFunc: ((ctx: CanvasRenderingContext2D) => void) | null = null
  canvasWidth = 0
  canvasHeight = 0
  padding = 80

  viewport: ViewportState = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  }

  backgroundColor = '#F4EFE7'

  init(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas
    setPlatformCanvas(canvas)
    this._dpr = getDevicePixelRatio()
    this._width = width
    this._height = height
    canvas.width = Math.round(width * this._dpr)
    canvas.height = Math.round(height * this._dpr)
    applyCanvasDisplaySize(canvas, width, height)
    this.ctx = canvas.getContext('2d')!
    this.ctx.scale(this._dpr, this._dpr)
    console.log(`[Engine] init: display=${width}x${height}, dpr=${this._dpr}, buffer=${canvas.width}x${canvas.height}`)
    this.startLoop()
    this.markDirty()
  }

  /** Resize the engine if the container size changed */
  resize(width: number, height: number) {
    if (width === this._width && height === this._height) return
    this._width = width
    this._height = height
    if (this.canvas) {
      this.canvas.width = Math.round(width * this._dpr)
      this.canvas.height = Math.round(height * this._dpr)
      applyCanvasDisplaySize(this.canvas, width, height)
    }
    if (this.ctx) {
      this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0)
    }
    if (this.canvasWidth > 0) {
      this.fitToView(this.canvasWidth, this.canvasHeight)
    }
    this.markDirty()
  }

  destroy() {
    if (this.rafId) {
      cancelFrame(this.rafId)
      this.rafId = 0
    }
    this.ctx = null
    this.canvas = null
  }

  markDirty() {
    this.dirty = true
  }

  private startLoop() {
    const loop = () => {
      if (this.dirty) {
        this.render()
        this.dirty = false
      }
      this.rafId = requestFrame(loop)
    }
    this.rafId = requestFrame(loop)
  }

  private render() {
    const ctx = this.ctx
    if (!ctx) return

    ctx.save()
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0)
    ctx.clearRect(0, 0, this._width, this._height)

    // Checkerboard background
    this.drawBackground(ctx)

    // Apply viewport transform
    ctx.translate(this.viewport.offsetX, this.viewport.offsetY)
    ctx.scale(this.viewport.scale, this.viewport.scale)

    // Canvas area offset (padding)
    ctx.translate(this.padding, this.padding)

    // Layer 1: Seam accessories (loop-tab, behind template)
    this.seamLayer.draw(ctx)

    // Layer 2: Clipped content (base fabric + patches + surface accessories)
    if (this.clipFunc) {
      ctx.save()
      this.clipFunc(ctx)
      ctx.clip()
      this.clippedLayer.draw(ctx)
      ctx.restore()
    } else {
      this.clippedLayer.draw(ctx)
    }

    // Layer 3: Overlay accessories (strap, handle — not clipped)
    this.overlayLayer.draw(ctx)

    ctx.restore()
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    // Crosshatch pattern like original
    const w = this._width
    const h = this._height
    ctx.fillStyle = '#F4EFE7'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#EDE8DF'
    ctx.lineWidth = 1
    for (let i = -h; i < w + h; i += 11) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + h, h)
      ctx.stroke()
    }
  }

  getNodeAt(screenX: number, screenY: number): EngineNode | null {
    const worldPt = this.screenToWorld(screenX, screenY)
    // Check overlay first (on top), then clipped, then seam
    const layers = [this.overlayLayer, this.clippedLayer, this.seamLayer]
    for (const layer of layers) {
      const nodes = layer.children.slice().reverse()
      for (const node of nodes) {
        if (!node.visible) continue
        if (node.id === 'base-fill') continue
        if (node.containsPoint(worldPt.x, worldPt.y)) {
          return node
        }
      }
    }
    return null
  }

  screenToWorld(sx: number, sy: number): Point {
    return {
      x: (sx - this.viewport.offsetX) / this.viewport.scale - this.padding,
      y: (sy - this.viewport.offsetY) / this.viewport.scale - this.padding,
    }
  }

  fitToView(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight

    const stageW = canvasWidth + this.padding * 2
    const stageH = canvasHeight + this.padding * 2

    const scaleX = (this._width - 32) / stageW
    const scaleY = (this._height - 32) / stageH
    const scale = Math.min(scaleX, scaleY, 1)

    this.viewport.scale = scale
    this.viewport.offsetX = (this._width - stageW * scale) / 2
    this.viewport.offsetY = (this._height - stageH * scale) / 2
    console.log(`[Engine] fitToView: display=${this._width}x${this._height}, project=${canvasWidth}x${canvasHeight}, scale=${scale.toFixed(3)}, offset=(${this.viewport.offsetX.toFixed(1)}, ${this.viewport.offsetY.toFixed(1)})`)
    this.markDirty()
  }
}
