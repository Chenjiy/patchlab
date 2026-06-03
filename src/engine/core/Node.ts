import type { Rect, Point } from './types'

let nextZIndex = 0

export abstract class EngineNode {
  id: string
  x = 0
  y = 0
  width = 0
  height = 0
  rotation = 0
  visible = true
  zIndex: number
  parent: GroupNode | null = null

  constructor(id: string) {
    this.id = id
    this.zIndex = nextZIndex++
  }

  abstract draw(ctx: CanvasRenderingContext2D): void

  getBounds(): Rect {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }

  containsPoint(px: number, py: number): boolean {
    const local = this.toLocal(px, py)
    return local.x >= 0 && local.x <= this.width && local.y >= 0 && local.y <= this.height
  }

  toLocal(px: number, py: number): Point {
    const cx = this.x + this.width / 2
    const cy = this.y + this.height / 2
    const dx = px - cx
    const dy = py - cy
    const rad = -this.rotation * Math.PI / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return {
      x: cos * dx - sin * dy + this.width / 2,
      y: sin * dx + cos * dy + this.height / 2,
    }
  }

  applyTransform(ctx: CanvasRenderingContext2D) {
    const cx = this.x + this.width / 2
    const cy = this.y + this.height / 2
    ctx.translate(cx, cy)
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation * Math.PI / 180)
    }
    ctx.translate(-this.width / 2, -this.height / 2)
  }
}

export class GroupNode extends EngineNode {
  children: EngineNode[] = []

  constructor(id: string) {
    super(id)
  }

  add(node: EngineNode) {
    node.parent = this
    this.children.push(node)
    this.sortChildren()
  }

  remove(node: EngineNode) {
    node.parent = null
    this.children = this.children.filter((c) => c !== node)
  }

  sortChildren() {
    this.children.sort((a, b) => a.zIndex - b.zIndex)
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.visible) return
    for (const child of this.children) {
      if (!child.visible) continue
      ctx.save()
      child.applyTransform(ctx)
      child.draw(ctx)
      ctx.restore()
    }
  }
}
