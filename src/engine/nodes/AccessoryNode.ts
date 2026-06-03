import { EngineNode } from '../core/Node'
import { PatternFillNode } from './PatternFillNode'
import type { AccessoryType } from '../../types'

export class AccessoryNode extends EngineNode {
  accessoryType: AccessoryType = 'zipper'
  color = '#8B6355'
  fill: PatternFillNode | null = null
  selected = false
  selectionColor = '#D8A7B1'
  cornerRadius = 0

  constructor(id: string) {
    super(id)
  }

  draw(ctx: CanvasRenderingContext2D) {
    switch (this.accessoryType) {
      case 'handle': this.drawHandle(ctx); break
      case 'webbing': this.drawWebbing(ctx); break
      case 'zipper': this.drawZipper(ctx); break
      case 'strap': this.drawStrap(ctx); break
      case 'snap-button': this.drawSnapButton(ctx); break
      case 'd-ring': this.drawDRing(ctx); break
      case 'buckle': this.drawBuckle(ctx); break
      case 'loop-tab': this.drawLoopTab(ctx); break
      case 'flap': this.drawFlap(ctx); break
    }

    if (this.selected) {
      ctx.strokeStyle = this.selectionColor
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.strokeRect(-2, -2, this.width + 4, this.height + 4)
      ctx.setLineDash([])
    }
  }

  private drawHandle(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const t = this.cornerRadius || Math.min(Math.round(h * 0.32), 18)
    const tabW = Math.min(18, Math.round(w * 0.16))

    // Arch bar
    this.drawFillRect(ctx, 0, 0, w, t, t / 2)

    // Left attachment tab
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.roundRect(4, t - 3, tabW, h - t + 3, [0, 0, 4, 4])
    ctx.fill()

    // Right attachment tab
    ctx.beginPath()
    ctx.roundRect(w - tabW - 4, t - 3, tabW, h - t + 3, [0, 0, 4, 4])
    ctx.fill()

    // Topstitch on arch
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(t, t / 2)
    ctx.lineTo(w - t, t / 2)
    ctx.stroke()

    // Tab stitching
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 2])
    ctx.strokeRect(6, t + 4, tabW - 4, h - t - 8)
    ctx.strokeRect(w - tabW - 2, t + 4, tabW - 4, h - t - 8)
    ctx.setLineDash([])
  }

  private drawWebbing(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height

    ctx.fillStyle = this.color
    ctx.fillRect(0, 0, w, h)

    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(0, 0, w, 2)

    // Edge stitching
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(4, 4); ctx.lineTo(4, h - 4)
    ctx.moveTo(w - 4, 4); ctx.lineTo(w - 4, h - 4)
    ctx.stroke()
    ctx.setLineDash([])

    // Horizontal weave lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i < Math.floor(h / 12); i++) {
      ctx.beginPath()
      ctx.moveTo(3, (i + 0.5) * 12)
      ctx.lineTo(w - 3, (i + 0.5) * 12)
      ctx.stroke()
    }
  }

  private drawZipper(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height

    // Main tape
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 2)
    ctx.fill()

    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(0, 0, w, 3)

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(0, h - 3, w, 3)

    // Center line
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(6, h / 2)
    ctx.lineTo(w - 6, h / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Teeth
    const numTeeth = Math.max(2, Math.floor(w / 8))
    const toothSpacing = w / numTeeth
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    for (let i = 0; i < numTeeth; i++) {
      ctx.beginPath()
      ctx.roundRect(i * toothSpacing + toothSpacing / 2 - 2.5, h / 2 - 3, 5, 6, 1)
      ctx.fill()
    }

    // Slider tab
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.roundRect(-6, -3, 10, h + 6, 2)
    ctx.fill()

    // Pull ring
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(-10, h / 2, 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  private drawStrap(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const t = this.cornerRadius || Math.max(14, Math.round(Math.min(w * 0.1, 30)))
    const legH = Math.round(h * 0.38)
    const inset = t * 0.22

    // Hollow arch shape clip
    ctx.save()
    ctx.beginPath()
    // Outer arch
    ctx.moveTo(0, h)
    ctx.lineTo(0, h - legH)
    ctx.bezierCurveTo(0, 0, w, 0, w, h - legH)
    ctx.lineTo(w, h)
    // Inner arch cutout (reverse)
    ctx.lineTo(w - t, h)
    ctx.lineTo(w - t, h - legH + t * 0.4)
    ctx.bezierCurveTo(w - t, t, t, t, t, h - legH + t * 0.4)
    ctx.lineTo(t, h)
    ctx.closePath()
    ctx.clip()

    // Fill
    if (this.fill && this.fill.isReady) {
      this.fill.width = w
      this.fill.height = h
      this.fill.draw(ctx)
    } else {
      ctx.fillStyle = this.color
      ctx.fillRect(0, 0, w, h)
    }

    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillRect(0, 0, w, t * 0.35)
    ctx.restore()

    // Outer topstitch
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(inset, h)
    ctx.lineTo(inset, h - legH + inset)
    ctx.bezierCurveTo(inset, inset, w - inset, inset, w - inset, h - legH + inset)
    ctx.lineTo(w - inset, h)
    ctx.stroke()

    // Inner topstitch
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'
    ctx.beginPath()
    const ii = t - inset
    ctx.moveTo(ii, h)
    ctx.lineTo(ii, h - legH + ii * 0.5)
    ctx.bezierCurveTo(ii, ii, w - ii, ii, w - ii, h - legH + ii * 0.5)
    ctx.lineTo(w - ii, h)
    ctx.stroke()
    ctx.setLineDash([])
  }

  private drawSnapButton(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(cx, cy)

    // Outer circle
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill()

    // Rim highlight
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fill()

    // Inner raised circle
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Specular highlight
    ctx.beginPath()
    ctx.arc(cx - r * 0.14, cy - r * 0.14, r * 0.18, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()

    // Cross mark
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.22, cy); ctx.lineTo(cx + r * 0.22, cy)
    ctx.moveTo(cx, cy - r * 0.22); ctx.lineTo(cx, cy + r * 0.22)
    ctx.stroke()

    // Outer rim
    ctx.beginPath()
    ctx.arc(cx, cy, r - 0.75, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  private drawDRing(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const cx = w / 2
    const cy = h / 2
    const outerR = Math.min(cx, cy) - 1
    const ringThickness = Math.max(4, Math.round(outerR * 0.28))

    // Ring
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
    ctx.strokeStyle = this.color
    ctx.lineWidth = ringThickness
    ctx.stroke()

    // Flat bar (D's straight side)
    ctx.fillStyle = this.color
    ctx.fillRect(cx - outerR - ringThickness / 2, cy - outerR, ringThickness, outerR * 2)

    // Metal sheen
    ctx.beginPath()
    ctx.arc(cx, cy, outerR - ringThickness * 0.3, -Math.PI * 0.6, -Math.PI * 0.1)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = ringThickness * 0.4
    ctx.stroke()
  }

  private drawBuckle(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const frame = Math.max(4, Math.round(Math.min(w, h) * 0.14))
    const slotW = Math.round((w - frame * 2 - 3) / 2)
    const slotH = h - frame * 2

    // Outer frame
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 4)
    ctx.fill()

    // Slot cutouts
    ctx.fillStyle = '#F4EFE7'
    ctx.beginPath()
    ctx.roundRect(frame, frame, slotW, slotH, 2)
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(frame + slotW + 3, frame, slotW, slotH, 2)
    ctx.fill()

    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.roundRect(2, 2, w - 4, 3, 2)
    ctx.fill()

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.beginPath()
    ctx.roundRect(2, h - 4, w - 4, 3, 2)
    ctx.fill()

    // Release button nub
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.roundRect(Math.round(w / 2) - 4, -5, 8, 8, [2, 2, 0, 0])
    ctx.fill()
  }

  private drawLoopTab(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height

    // Body
    this.drawFillRect(ctx, 0, 0, w, h, 4)

    // Center fold line
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(3, h / 2)
    ctx.lineTo(w - 3, h / 2)
    ctx.stroke()

    // Edge stitching
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 2])
    ctx.strokeRect(3, 3, w - 6, h - 6)
    ctx.setLineDash([])
  }

  private drawFlap(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const cr = this.cornerRadius || 0

    // Body with rounded bottom corners
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, [0, 0, cr, cr])
    ctx.clip()

    if (this.fill && this.fill.isReady) {
      this.fill.width = w
      this.fill.height = h
      this.fill.draw(ctx)
    } else {
      ctx.fillStyle = this.color
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()

    // Top seam shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0, 0, w, 5)

    // Inner stitching
    const innerCr = Math.max(0, cr - 4)
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.roundRect(6, 10, w - 12, h - 16, [0, 0, innerCr, innerCr])
    ctx.stroke()
    ctx.setLineDash([])
  }

  private drawFillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radius)
    ctx.clip()

    if (this.fill && this.fill.isReady) {
      this.fill.width = w
      this.fill.height = h
      this.fill.draw(ctx)
    } else {
      ctx.fillStyle = this.color
      ctx.fillRect(x, y, w, h)
    }
    ctx.restore()
  }
}
