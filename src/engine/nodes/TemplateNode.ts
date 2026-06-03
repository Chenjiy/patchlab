import { EngineNode } from '../core/Node'
import { PatternFillNode } from './PatternFillNode'
import type { CanvasTemplate } from '../../types'

export class TemplateNode extends EngineNode {
  templateType: string = 'rect'
  shape: 'rect' | 'trapezoid' = 'rect'
  topWidth = 0
  bottomWidth = 0
  cornerRadius = 0
  fillColor = '#FFFFFF'
  strokeColor = '#C8BEB4'
  strokeWidth = 2
  baseFill: PatternFillNode | null = null

  constructor(id: string) {
    super(id)
    this.zIndex = -1
  }

  setupFromTemplate(template: CanvasTemplate, project: { customTopCm?: number; customBottomCm?: number; customCornerMm?: number }) {
    this.width = template.width
    this.height = template.height
    this.templateType = template.id
    this.shape = template.shape || 'rect'

    if (this.shape === 'trapezoid') {
      const PX_PER_CM = 38
      const topCm = project.customTopCm ?? 18
      const bottomCm = project.customBottomCm ?? 26
      this.topWidth = topCm * PX_PER_CM
      this.bottomWidth = bottomCm * PX_PER_CM
      const cornerMm = project.customCornerMm ?? 10
      this.cornerRadius = (cornerMm / 10) * PX_PER_CM
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw template shape with fill
    if (this.shape === 'trapezoid') {
      this.drawTrapezoid(ctx)
    } else {
      this.drawRect(ctx)
    }

    // Draw base fabric fill clipped to template
    if (this.baseFill && this.baseFill.isReady) {
      ctx.save()
      this.getClipPath(ctx)
      ctx.clip()
      this.baseFill.width = this.width
      this.baseFill.height = this.height
      this.baseFill.draw(ctx)
      ctx.restore()

      // Re-draw border on top
      ctx.save()
      this.getClipPath(ctx)
      ctx.strokeStyle = this.strokeColor
      ctx.lineWidth = this.strokeWidth
      ctx.stroke()
      ctx.restore()
    }
  }

  private drawRect(ctx: CanvasRenderingContext2D) {
    const r = this.cornerRadius || 8
    ctx.beginPath()
    ctx.roundRect(0, 0, this.width, this.height, r)
    ctx.fillStyle = this.fillColor
    ctx.fill()
    ctx.strokeStyle = this.strokeColor
    ctx.lineWidth = this.strokeWidth
    ctx.stroke()
  }

  private drawTrapezoid(ctx: CanvasRenderingContext2D) {
    const w = this.width
    const h = this.height
    const tw = this.topWidth || w * 0.7
    const bw = this.bottomWidth || w
    const topLeft = (w - tw) / 2
    const topRight = topLeft + tw
    const botLeft = (w - bw) / 2
    const botRight = botLeft + bw

    ctx.beginPath()
    ctx.moveTo(topLeft, 0)
    ctx.lineTo(topRight, 0)
    ctx.lineTo(botRight, h)
    ctx.lineTo(botLeft, h)
    ctx.closePath()

    ctx.fillStyle = this.fillColor
    ctx.fill()
    ctx.strokeStyle = this.strokeColor
    ctx.lineWidth = this.strokeWidth
    ctx.stroke()
  }

  getClipPath(ctx: CanvasRenderingContext2D) {
    if (this.shape === 'trapezoid') {
      const w = this.width
      const h = this.height
      const tw = this.topWidth || w * 0.7
      const bw = this.bottomWidth || w
      const topLeft = (w - tw) / 2
      const topRight = topLeft + tw
      const botLeft = (w - bw) / 2
      const botRight = botLeft + bw
      ctx.beginPath()
      ctx.moveTo(topLeft, 0)
      ctx.lineTo(topRight, 0)
      ctx.lineTo(botRight, h)
      ctx.lineTo(botLeft, h)
      ctx.closePath()
    } else {
      const r = this.cornerRadius || 8
      ctx.beginPath()
      ctx.roundRect(0, 0, this.width, this.height, r)
    }
  }
}
