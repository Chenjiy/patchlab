import { EngineNode } from '../core/Node'
import { PatternFillNode } from './PatternFillNode'
import { drawSvgPath } from '../../utils/svgPath'
import type { MaskShape } from '../../types'

export type EdgeStyle = 'none' | 'topstitch' | 'double-topstitch' | 'saddle-stitch' | 'overlock'

export class PatchNode extends EngineNode {
  fill: PatternFillNode
  maskShape: MaskShape | null = null
  selected = false
  selectionColor = '#D8A7B1'
  edgeStyle: EdgeStyle = 'none'
  edgeColor = '#8A7F78'
  stitchSpacing = 6

  constructor(id: string) {
    super(id)
    this.fill = new PatternFillNode(`${id}-fill`)
  }

  setMask(shape: MaskShape) {
    this.maskShape = shape
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.maskShape) return

    // Clip to mask shape and draw fill
    ctx.save()
    this.buildClipPath(ctx)
    ctx.clip()

    // Draw fabric fill
    this.fill.width = this.width
    this.fill.height = this.height
    if (this.fill.isReady) {
      this.fill.draw(ctx)
    } else {
      ctx.fillStyle = '#E8DED6'
      ctx.fillRect(0, 0, this.width, this.height)
    }

    // Edge stitching (inside clip)
    if (this.edgeStyle !== 'none') {
      this.drawEdgeStitch(ctx)
    }

    ctx.restore()

    // Selection border
    if (this.selected) {
      ctx.save()
      this.buildClipPath(ctx)
      ctx.strokeStyle = this.selectionColor
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }
  }

  private drawEdgeStitch(ctx: CanvasRenderingContext2D) {
    const { width: w, height: h } = this
    const spacing = this.stitchSpacing
    const dash = spacing * 0.5
    const gap = spacing * 0.6

    ctx.strokeStyle = this.edgeColor
    const scaleX = w / this.maskShape!.defaultWidth
    const scaleY = h / this.maskShape!.defaultHeight
    const isSvg = (this.maskShape!.type === 'svg' || this.maskShape!.type === 'custom') && !!this.maskShape!.svgPath
    const isCircle = this.maskShape!.type === 'circle'

    if (isSvg) {
      const svgPath = this.maskShape!.svgPath!
      if (this.edgeStyle === 'topstitch') {
        ctx.lineWidth = 1.5
        ctx.setLineDash([dash, gap])
        this.strokeSvgPath(ctx, svgPath, scaleX, scaleY)
      } else if (this.edgeStyle === 'double-topstitch') {
        ctx.lineWidth = 1
        ctx.setLineDash([dash, gap])
        this.strokeSvgPath(ctx, svgPath, scaleX, scaleY)
        const innerSx = scaleX * (w - 10) / w
        const innerSy = scaleY * (h - 10) / h
        ctx.save()
        ctx.translate(5, 5)
        ctx.lineWidth = 1
        this.strokeSvgPath(ctx, svgPath, innerSx, innerSy)
        ctx.restore()
      } else if (this.edgeStyle === 'saddle-stitch') {
        ctx.lineWidth = 2
        ctx.setLineDash([dash, gap])
        this.strokeSvgPath(ctx, svgPath, scaleX, scaleY)
        ctx.globalAlpha = 0.55
        ctx.setLineDash([dash, gap])
        ctx.lineDashOffset = (dash + gap) / 2
        this.strokeSvgPath(ctx, svgPath, scaleX, scaleY)
        ctx.globalAlpha = 1
        ctx.lineDashOffset = 0
      } else if (this.edgeStyle === 'overlock') {
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 5
        ctx.setLineDash([dash * 0.5, gap * 0.7])
        this.strokeSvgPath(ctx, svgPath, scaleX, scaleY)
        ctx.globalAlpha = 1
        ctx.lineWidth = 1.5
        ctx.setLineDash([dash, gap * 1.5])
        this.strokeSvgPath(ctx, svgPath, scaleX, scaleY)
      }
    } else if (isCircle) {
      const cx = w / 2
      const cy = h / 2
      const halfR = Math.min(w, h) / 2
      if (this.edgeStyle === 'topstitch') {
        ctx.lineWidth = 1.5
        ctx.setLineDash([dash, gap])
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 5, 0, Math.PI * 2)
        ctx.stroke()
      } else if (this.edgeStyle === 'double-topstitch') {
        ctx.lineWidth = 1
        ctx.setLineDash([dash, gap])
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 8, 0, Math.PI * 2)
        ctx.stroke()
      } else if (this.edgeStyle === 'saddle-stitch') {
        ctx.lineWidth = 2
        ctx.setLineDash([dash, gap])
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 0.55
        ctx.lineDashOffset = (dash + gap) / 2
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.lineDashOffset = 0
      } else if (this.edgeStyle === 'overlock') {
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 5
        ctx.setLineDash([dash * 0.5, gap * 0.7])
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 1, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.lineWidth = 1.5
        ctx.setLineDash([dash, gap * 1.5])
        ctx.beginPath()
        ctx.arc(cx, cy, halfR - 4, 0, Math.PI * 2)
        ctx.stroke()
      }
    } else {
      // Rectangle
      if (this.edgeStyle === 'topstitch') {
        ctx.lineWidth = 1.5
        ctx.setLineDash([dash, gap])
        ctx.strokeRect(5, 5, w - 10, h - 10)
      } else if (this.edgeStyle === 'double-topstitch') {
        ctx.lineWidth = 1
        ctx.setLineDash([dash, gap])
        ctx.strokeRect(3, 3, w - 6, h - 6)
        ctx.strokeRect(9, 9, w - 18, h - 18)
      } else if (this.edgeStyle === 'saddle-stitch') {
        ctx.lineWidth = 2
        ctx.setLineDash([dash, gap])
        ctx.strokeRect(5, 5, w - 10, h - 10)
        ctx.globalAlpha = 0.55
        ctx.lineDashOffset = (dash + gap) / 2
        ctx.strokeRect(5, 5, w - 10, h - 10)
        ctx.globalAlpha = 1
        ctx.lineDashOffset = 0
      } else if (this.edgeStyle === 'overlock') {
        this.drawOverlockRect(ctx, w, h, spacing)
      }
    }
    ctx.setLineDash([])
  }

  private strokeSvgPath(ctx: CanvasRenderingContext2D, svgPath: string, sx: number, sy: number) {
    ctx.beginPath()
    const proxy = {
      beginPath() {},
      moveTo(x: number, y: number) { ctx.moveTo(x, y) },
      lineTo(x: number, y: number) { ctx.lineTo(x, y) },
      bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) { ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) },
      quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) { ctx.quadraticCurveTo(cpx, cpy, x, y) },
      closePath() { ctx.closePath() },
      arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean) { ctx.arc(x, y, r, start, end, ccw) },
    }
    drawSvgPath(proxy as any, svgPath, sx, sy)
    ctx.stroke()
  }

  private drawOverlockRect(ctx: CanvasRenderingContext2D, w: number, h: number, spacing: number) {
    const amp = 5
    const step = Math.max(spacing / 2, 2)
    const dash = spacing * 0.5
    const gap = spacing * 0.6

    // Zigzag around border
    ctx.beginPath()
    let inward = false
    for (let x = 0; x <= w; x += step) {
      const py = inward ? amp : 0
      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(Math.min(x, w), py)
      inward = !inward
    }
    for (let y = step; y <= h; y += step) {
      ctx.lineTo(inward ? w - amp : w, Math.min(y, h))
      inward = !inward
    }
    for (let x = w - step; x >= 0; x -= step) {
      ctx.lineTo(Math.max(x, 0), inward ? h - amp : h)
      inward = !inward
    }
    for (let y = h - step; y >= 0; y -= step) {
      ctx.lineTo(inward ? amp : 0, Math.max(y, 0))
      inward = !inward
    }
    ctx.strokeStyle = this.edgeColor
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.7
    ctx.stroke()
    ctx.globalAlpha = 1

    // Inner dashed line
    ctx.setLineDash([dash * 0.7, gap * 1.3])
    ctx.lineWidth = 1
    ctx.strokeRect(4, 4, w - 8, h - 8)
    ctx.setLineDash([])
  }

  private buildClipPath(ctx: CanvasRenderingContext2D) {
    const shape = this.maskShape!
    const { width, height } = this
    ctx.beginPath()

    switch (shape.type) {
      case 'circle': {
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
        break
      }
      case 'rect': {
        ctx.rect(0, 0, width, height)
        break
      }
      case 'svg':
      case 'custom': {
        if (shape.svgPath) {
          const scaleX = width / shape.defaultWidth
          const scaleY = height / shape.defaultHeight
          const proxy = {
            beginPath() {},
            moveTo(x: number, y: number) { ctx.moveTo(x, y) },
            lineTo(x: number, y: number) { ctx.lineTo(x, y) },
            bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) { ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) },
            quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) { ctx.quadraticCurveTo(cpx, cpy, x, y) },
            closePath() { ctx.closePath() },
            arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean) { ctx.arc(x, y, r, start, end, ccw) },
          }
          drawSvgPath(proxy as any, shape.svgPath, scaleX, scaleY)
        } else if (shape.rawPoints && shape.rawPoints.length >= 4) {
          const pts = shape.rawPoints
          const sx = width / shape.defaultWidth
          const sy = height / shape.defaultHeight
          ctx.moveTo(pts[0] * sx, pts[1] * sy)
          for (let i = 2; i < pts.length; i += 2) {
            ctx.lineTo(pts[i] * sx, pts[i + 1] * sy)
          }
          ctx.closePath()
        } else {
          ctx.rect(0, 0, width, height)
        }
        break
      }
    }
  }

  containsPoint(px: number, py: number): boolean {
    const local = this.toLocal(px, py)
    return local.x >= 0 && local.x <= this.width && local.y >= 0 && local.y <= this.height
  }
}
