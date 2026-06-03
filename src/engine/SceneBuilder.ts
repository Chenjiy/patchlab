import { CanvasEngine } from './core/Engine'
import { PatternFillNode } from './nodes/PatternFillNode'
import { PatchNode } from './nodes/PatchNode'
import { AccessoryNode } from './nodes/AccessoryNode'
import { CANVAS_TEMPLATES, PX_PER_CM } from '../data/templates'
import { getMaskById } from '../data/maskShapes'
import { getFabricById, getCustomShapes } from '../services/storageService'
import type { DesignProject, PatchLayer, Accessory, AccessoryType } from '../types'

const SEAM_TYPES: AccessoryType[] = ['loop-tab']
const OVERLAY_TYPES: AccessoryType[] = ['strap', 'handle']

export class SceneBuilder {
  private engine: CanvasEngine
  private baseFillNode: PatternFillNode | null = null
  private patchNodes: Map<string, PatchNode> = new Map()
  private accessoryNodes: Map<string, AccessoryNode> = new Map()

  constructor(engine: CanvasEngine) {
    this.engine = engine
  }

  buildFromProject(project: DesignProject) {
    this.clear()

    const template = CANVAS_TEMPLATES.find((t) => t.id === project.templateType)
    if (!template) return

    const cW = project.canvasWidth
    const cH = project.canvasHeight

    // Set clip function on engine (clips patches + surface accessories to template shape)
    this.engine.clipFunc = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath()
      if (template.shape === 'trapezoid') {
        ctx.moveTo(cW * 0.12, 0)
        ctx.lineTo(cW * 0.88, 0)
        ctx.lineTo(cW, cH)
        ctx.lineTo(0, cH)
        ctx.closePath()
      } else if (project.templateType === 'custom') {
        const topCm = project.customTopCm ?? cW / PX_PER_CM
        const botCm = project.customBottomCm ?? cW / PX_PER_CM
        const corner = project.customCornerMm ?? 0
        const isTrap = Math.abs(topCm - botCm) > 0.05
        const topPx = topCm * PX_PER_CM
        const botPx = botCm * PX_PER_CM

        if (isTrap) {
          const tOff = (cW - topPx) / 2
          const bOff = (cW - botPx) / 2
          if (corner > 0) {
            const r = (corner * PX_PER_CM) / 10
            const pts = [
              { x: tOff, y: 0 }, { x: cW - tOff, y: 0 },
              { x: cW - bOff, y: cH }, { x: bOff, y: cH },
            ]
            this.clipRoundedPolygon(ctx, pts, r)
          } else {
            ctx.moveTo(tOff, 0)
            ctx.lineTo(cW - tOff, 0)
            ctx.lineTo(cW - bOff, cH)
            ctx.lineTo(bOff, cH)
            ctx.closePath()
          }
        } else {
          if (corner > 0) {
            const r = (corner * PX_PER_CM) / 10
            ctx.roundRect(0, 0, cW, cH, r)
          } else {
            ctx.rect(0, 0, cW, cH)
          }
        }
      } else {
        ctx.rect(0, 0, cW, cH)
      }
    }

    // Base fabric fill (inside clipped layer)
    const baseFabric = project.baseFabricId ? getFabricById(project.baseFabricId) : null
    this.baseFillNode = new PatternFillNode('base-fill')
    this.baseFillNode.x = 0
    this.baseFillNode.y = 0
    this.baseFillNode.width = cW
    this.baseFillNode.height = cH
    this.baseFillNode.zIndex = -1
    this.baseFillNode.tileSize = 96 * (project.baseFabricScale ?? 1)
    this.baseFillNode.textureOffsetX = project.baseFabricOffsetX ?? 0
    this.baseFillNode.textureOffsetY = project.baseFabricOffsetY ?? 0
    this.baseFillNode.saturation = project.baseFabricSaturation ?? 0
    this.baseFillNode.brightness = project.baseFabricBrightness ?? 0
    this.baseFillNode.onImageLoaded = () => this.engine.markDirty()
    if (baseFabric) {
      this.baseFillNode.setImage(baseFabric.processedImage)
    }
    this.engine.clippedLayer.add(this.baseFillNode)

    // Patch layers (sorted by zIndex)
    const sortedLayers = [...project.patchLayers].sort((a, b) => a.zIndex - b.zIndex)
    for (const layer of sortedLayers) {
      this.addPatchNode(layer)
    }

    // Accessories — split into 3 groups
    const accessories = project.accessories || []
    const seamAcc = accessories.filter(a => SEAM_TYPES.includes(a.type)).sort((a, b) => a.zIndex - b.zIndex)
    const overlayAcc = accessories.filter(a => OVERLAY_TYPES.includes(a.type)).sort((a, b) => a.zIndex - b.zIndex)
    const surfaceAcc = accessories.filter(a => !SEAM_TYPES.includes(a.type) && !OVERLAY_TYPES.includes(a.type)).sort((a, b) => a.zIndex - b.zIndex)

    for (const acc of seamAcc) {
      this.addAccessoryNode(acc, 'seam')
    }
    for (const acc of surfaceAcc) {
      this.addAccessoryNode(acc, 'surface')
    }
    for (const acc of overlayAcc) {
      this.addAccessoryNode(acc, 'overlay')
    }

    // Sort layers
    this.engine.seamLayer.sortChildren()
    this.engine.clippedLayer.sortChildren()
    this.engine.overlayLayer.sortChildren()

    // Debug: log node positions
    const allNodes = [...this.engine.clippedLayer.children, ...this.engine.overlayLayer.children, ...this.engine.seamLayer.children]
    for (const n of allNodes) {
      if (n.id !== 'base-fill') {
        console.log(`[Scene] node "${n.id}" at (${n.x}, ${n.y}) size ${n.width}x${n.height}`)
      }
    }

    // Fit canvas to view
    this.engine.fitToView(cW, cH)
    this.engine.markDirty()
  }

  private addPatchNode(layer: PatchLayer) {
    const mask = getMaskById(layer.maskShapeId, getCustomShapes())
    if (!mask) return

    const fabric = getFabricById(layer.fabricTextureId)
    const patch = new PatchNode(layer.id)
    patch.x = layer.x
    patch.y = layer.y
    patch.width = layer.width
    patch.height = layer.height
    patch.rotation = layer.rotation
    patch.zIndex = layer.zIndex
    patch.setMask(mask)
    patch.edgeStyle = layer.edgeStyle || 'none'
    patch.edgeColor = layer.edgeColor || '#8A7F78'
    patch.stitchSpacing = layer.stitchSpacing || 6

    if (fabric) {
      patch.fill.tileSize = 80 * (layer.textureScale || 1)
      patch.fill.textureOffsetX = layer.textureOffsetX || 0
      patch.fill.textureOffsetY = layer.textureOffsetY || 0
      patch.fill.textureRotation = layer.textureRotation || 0
      patch.fill.saturation = layer.colorSaturation ?? 0
      patch.fill.brightness = layer.colorBrightness ?? 0
      patch.fill.onImageLoaded = () => this.engine.markDirty()
      patch.fill.setImage(fabric.processedImage)
    }

    this.patchNodes.set(layer.id, patch)
    this.engine.clippedLayer.add(patch)
  }

  private addAccessoryNode(accessory: Accessory, group: 'seam' | 'surface' | 'overlay') {
    const node = new AccessoryNode(accessory.id)
    node.x = accessory.x
    node.y = accessory.y
    node.width = accessory.width
    node.height = accessory.height
    node.rotation = accessory.rotation
    node.accessoryType = accessory.type
    node.color = accessory.color
    node.zIndex = accessory.zIndex + (group === 'surface' ? 1000 : group === 'overlay' ? 2000 : -1000)
    node.cornerRadius = accessory.cornerRadius ?? 0

    if (accessory.fabricTextureId) {
      const fabric = getFabricById(accessory.fabricTextureId)
      if (fabric) {
        node.fill = new PatternFillNode(`${accessory.id}-fill`)
        const baseTileSize = accessory.type === 'flap' ? 80 : 60
        node.fill.tileSize = baseTileSize * (accessory.fabricScale || 1)
        node.fill.saturation = accessory.fabricSaturation ?? 0
        node.fill.brightness = accessory.fabricBrightness ?? 0
        node.fill.onImageLoaded = () => this.engine.markDirty()
        node.fill.setImage(fabric.processedImage)
      }
    }

    this.accessoryNodes.set(accessory.id, node)
    if (group === 'seam') this.engine.seamLayer.add(node)
    else if (group === 'overlay') this.engine.overlayLayer.add(node)
    else this.engine.clippedLayer.add(node)
  }

  private clipRoundedPolygon(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], r: number) {
    const n = pts.length
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n]
      const curr = pts[i]
      const next = pts[(i + 1) % n]
      const dx1 = prev.x - curr.x, dy1 = prev.y - curr.y
      const dx2 = next.x - curr.x, dy2 = next.y - curr.y
      const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
      const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
      const cr = Math.min(r, l1 / 2, l2 / 2)
      const t1 = { x: curr.x + (dx1 / l1) * cr, y: curr.y + (dy1 / l1) * cr }
      const t2 = { x: curr.x + (dx2 / l2) * cr, y: curr.y + (dy2 / l2) * cr }
      if (i === 0) ctx.moveTo(t1.x, t1.y)
      else ctx.lineTo(t1.x, t1.y)
      ctx.quadraticCurveTo(curr.x, curr.y, t2.x, t2.y)
    }
    ctx.closePath()
  }

  clear() {
    this.engine.seamLayer.children = []
    this.engine.clippedLayer.children = []
    this.engine.overlayLayer.children = []
    this.engine.clipFunc = null
    this.baseFillNode = null
    this.patchNodes.clear()
    this.accessoryNodes.clear()
  }

  getPatchNode(id: string): PatchNode | undefined {
    return this.patchNodes.get(id)
  }

  getAccessoryNode(id: string): AccessoryNode | undefined {
    return this.accessoryNodes.get(id)
  }

  getAllPatchNodes(): PatchNode[] {
    return Array.from(this.patchNodes.values())
  }

  getAllAccessoryNodes(): AccessoryNode[] {
    return Array.from(this.accessoryNodes.values())
  }

  getAllSelectableNodes(): (PatchNode | AccessoryNode)[] {
    return [...this.getAllPatchNodes(), ...this.getAllAccessoryNodes()]
  }
}
