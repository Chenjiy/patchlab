import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Rect, Line, Circle, Transformer } from 'react-konva'
import Konva from 'konva'
import type { Accessory, AccessoryType, DesignProject, PatchLayer } from '../../types'
import { getMaskById } from '../../data/maskShapes'
import { getFabricById } from '../../services/storageService'
import { CANVAS_TEMPLATES, CANVAS_PADDING, PX_PER_CM } from '../../data/templates'
import { processImage } from '../../utils/imageProcessing'
import PatchLayerNode from './PatchLayerNode'
import AccessoryNode from './AccessoryNode'

interface TransformChange {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

interface Props {
  project: DesignProject
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null, addToSelection?: boolean) => void
  onUpdateLayer: (id: string, updates: Partial<PatchLayer>) => void
  onTransformLayersEnd: (changes: TransformChange[]) => void
  selectedAccessoryId: string | null
  onSelectAccessory: (id: string | null) => void
  onUpdateAccessory: (id: string, updates: Partial<Accessory>) => void
  stageRef: React.RefObject<Konva.Stage | null>
  drawMode?: boolean
  drawnPoints?: number[]
  onAddDrawPoint?: (x: number, y: number) => void
  onMoveDrawPoint?: (index: number, x: number, y: number) => void
  onFinalizeDrawn?: () => void
}

// loop-tab: sewn into seam — behind template fabric, protrudes at edges
const SEAM_TYPES: AccessoryType[] = ['loop-tab']
// strap/handle: arch over the bag — on top of template but NOT clipped (arch extends beyond edges)
const OVERLAY_TYPES: AccessoryType[] = ['strap', 'handle']

function clipRoundedPolygon(ctx: any, pts: { x: number; y: number }[], r: number) {
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

function buildClipFunc(project: DesignProject) {
  return (ctx: any) => {
    const cW = project.canvasWidth
    const cH = project.canvasHeight
    const template = CANVAS_TEMPLATES.find((t) => t.id === project.templateType)

    ctx.beginPath()

    if (template?.shape === 'trapezoid') {
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
          clipRoundedPolygon(ctx, [
            { x: tOff, y: 0 }, { x: cW - tOff, y: 0 },
            { x: cW - bOff, y: cH }, { x: bOff, y: cH },
          ], (corner * PX_PER_CM) / 10)
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
          ctx.moveTo(r, 0); ctx.lineTo(cW - r, 0)
          ctx.arcTo(cW, 0, cW, r, r); ctx.lineTo(cW, cH - r)
          ctx.arcTo(cW, cH, cW - r, cH, r); ctx.lineTo(r, cH)
          ctx.arcTo(0, cH, 0, cH - r, r); ctx.lineTo(0, r)
          ctx.arcTo(0, 0, r, 0, r); ctx.closePath()
        } else {
          ctx.rect(0, 0, cW, cH)
        }
      }
    } else {
      ctx.rect(0, 0, cW, cH)
    }
  }
}

export default function DesignCanvas({
  project,
  selectedLayerIds,
  onSelectLayer,
  onUpdateLayer,
  onTransformLayersEnd,
  selectedAccessoryId,
  onSelectAccessory,
  onUpdateAccessory,
  stageRef,
  drawMode = false,
  drawnPoints = [],
  onAddDrawPoint,
  onMoveDrawPoint,
  onFinalizeDrawn,
}: Props) {
  const bgImgRef = useRef<HTMLImageElement | null>(null)
  const bgProcessedRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null)
  const bgRectRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const layerNodeRefs = useRef<Map<string, Konva.Group | null>>(new Map())
  const accessoryNodeRefs = useRef<Map<string, Konva.Group | null>>(new Map())
  const [, forceUpdate] = useState(0)

  // Refs so async onload always reads latest sat/bri even if state updated while image loads
  const baseSatRef = useRef(project.baseFabricSaturation ?? 0)
  const baseBriRef = useRef(project.baseFabricBrightness ?? 0)
  baseSatRef.current = project.baseFabricSaturation ?? 0
  baseBriRef.current = project.baseFabricBrightness ?? 0

  const baseFabric = getFabricById(project.baseFabricId)

  // Auto-fit: scale stage down so it never overflows the container
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const stageW = project.canvasWidth + CANVAS_PADDING * 2
  const stageH = project.canvasHeight + CANVAS_PADDING * 2

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const avW = width - 64   // 2 × p-8 (32px each side)
      const avH = height - 64
      setScale(Math.max(0.15, Math.min(1, avW / stageW, avH / stageH)))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [stageW, stageH])

  useEffect(() => {
    if (!baseFabric?.processedImage) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = baseFabric.processedImage
    img.onload = () => {
      bgImgRef.current = img
      const processed = processImage(img, baseSatRef.current, baseBriRef.current)
      bgProcessedRef.current = processed
      bgRectRef.current?.fillPatternImage(processed as HTMLImageElement)
      bgRectRef.current?.getLayer()?.batchDraw()
      forceUpdate((n) => n + 1)
    }
  }, [baseFabric?.processedImage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const img = bgImgRef.current
    const rect = bgRectRef.current
    if (!img || !rect) return
    const processed = processImage(img, project.baseFabricSaturation ?? 0, project.baseFabricBrightness ?? 0)
    bgProcessedRef.current = processed
    rect.fillPatternImage(processed as HTMLImageElement)
    rect.getLayer()?.batchDraw()
  }, [project.baseFabricSaturation, project.baseFabricBrightness])

  useEffect(() => {
    bgRectRef.current?.getLayer()?.batchDraw()
  }, [project.baseFabricScale, project.baseFabricOffsetX, project.baseFabricOffsetY])

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    if (drawMode) {
      tr.nodes([])
    } else if (selectedAccessoryId) {
      const node = accessoryNodeRefs.current.get(selectedAccessoryId)
      tr.nodes(node ? [node] : [])
    } else if (selectedLayerIds.length > 0) {
      const nodes = selectedLayerIds
        .map(id => layerNodeRefs.current.get(id))
        .filter((n): n is Konva.Group => n != null)
      tr.nodes(nodes)
    } else {
      tr.nodes([])
    }
    tr.getLayer()?.batchDraw()
  }, [selectedLayerIds, selectedAccessoryId, drawMode])

  const sorted = [...project.patchLayers].sort((a, b) => a.zIndex - b.zIndex)
  const tileSize = 96 * (project.baseFabricScale ?? 1)
  const clipFunc = buildClipFunc(project)

  const seamAccessories = (project.accessories?.filter(a => SEAM_TYPES.includes(a.type)) ?? [])
    .sort((a, b) => a.zIndex - b.zIndex)
  const overlayAccessories = (project.accessories?.filter(a => OVERLAY_TYPES.includes(a.type)) ?? [])
    .sort((a, b) => a.zIndex - b.zIndex)
  const surfaceAccessories = (project.accessories?.filter(a => !SEAM_TYPES.includes(a.type) && !OVERLAY_TYPES.includes(a.type)) ?? [])
    .sort((a, b) => a.zIndex - b.zIndex)

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawMode) {
      if ((e.target as Konva.Node).name() === 'draw-anchor') return
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos && onAddDrawPoint) {
        onAddDrawPoint(pos.x - CANVAS_PADDING, pos.y - CANVAS_PADDING)
      }
      return
    }
    if (e.target === e.target.getStage()) {
      onSelectLayer(null, false)
      onSelectAccessory(null)
    }
  }

  const handleStageDblClick = () => {
    if (drawMode && drawnPoints.length >= 6 && onFinalizeDrawn) {
      onFinalizeDrawn()
    }
  }

  const handleTransformEnd = () => {
    const tr = transformerRef.current
    if (!tr) return

    // Accessory transform
    if (selectedAccessoryId) {
      const node = accessoryNodeRefs.current.get(selectedAccessoryId)
      if (node && tr.nodes().includes(node)) {
        const acc = project.accessories?.find(a => a.id === selectedAccessoryId)
        if (acc) {
          const sX = node.scaleX()
          const sY = node.scaleY()
          onUpdateAccessory(selectedAccessoryId, {
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.max(10, Math.round(acc.width * sX)),
            height: Math.max(6, Math.round(acc.height * sY)),
            rotation: Math.round(node.rotation() * 10) / 10,
          })
          node.scaleX(1)
          node.scaleY(1)
        }
        return
      }
    }

    // Patch layer transforms
    const changes: TransformChange[] = []
    tr.nodes().forEach((node) => {
      const id = selectedLayerIds.find(lid => layerNodeRefs.current.get(lid) === node)
      if (!id) return
      const pl = project.patchLayers.find(l => l.id === id)
      if (!pl) return
      const sX = node.scaleX()
      const sY = node.scaleY()
      changes.push({
        id,
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        width: Math.max(20, Math.round(pl.width * sX)),
        height: Math.max(20, Math.round(pl.height * sY)),
        rotation: Math.round(node.rotation() * 10) / 10,
      })
      node.scaleX(1)
      node.scaleY(1)
    })
    if (changes.length > 0) onTransformLayersEnd(changes)
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center rounded-3xl shadow-inner"
      style={{
        background: 'repeating-linear-gradient(45deg, #F4EFE7 0px, #F4EFE7 10px, #EDE8DF 10px, #EDE8DF 11px)',
        padding: 32,
        minHeight: 400,
        height: '100%',
      }}
    >
      {/* Scaled wrapper: occupies stageW*scale × stageH*scale CSS pixels */}
      <div style={{ position: 'relative', width: stageW * scale, height: stageH * scale, flexShrink: 0 }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: stageW, height: stageH, position: 'absolute', top: 0, left: 0 }}>
          <Stage
            ref={stageRef as React.RefObject<Konva.Stage>}
            width={stageW}
            height={stageH}
            style={{ cursor: drawMode ? 'crosshair' : 'default' }}
            onClick={handleStageClick}
            onDblClick={handleStageDblClick}
          >
            {/* Layer 1: Seam accessories (loop-tab) — unclipped, behind template fabric */}
            <Layer>
              <Group x={CANVAS_PADDING} y={CANVAS_PADDING}>
                {!drawMode && seamAccessories.map((acc) => (
                  <AccessoryNode
                    key={acc.id}
                    accessory={acc}
                    isSelected={selectedAccessoryId === acc.id}
                    onSelect={() => onSelectAccessory(acc.id)}
                    onChange={(updates) => onUpdateAccessory(acc.id, updates)}
                    onMount={(node) => {
                      if (node) accessoryNodeRefs.current.set(acc.id, node)
                      else accessoryNodeRefs.current.delete(acc.id)
                    }}
                  />
                ))}
              </Group>
            </Layer>

            {/* Layer 2: Template fabric + patches + surface accessories — clipped to template shape */}
            <Layer>
              <Group x={CANVAS_PADDING} y={CANVAS_PADDING} clipFunc={clipFunc}>
                {/* Base fabric */}
                <Rect
                  ref={bgRectRef}
                  x={0} y={0}
                  width={project.canvasWidth}
                  height={project.canvasHeight}
                  fillPatternImage={bgProcessedRef.current ?? undefined}
                  fillPatternRepeat="repeat"
                  fillPatternScaleX={tileSize / 512}
                  fillPatternScaleY={tileSize / 512}
                  fillPatternOffsetX={-(project.baseFabricOffsetX ?? 0)}
                  fillPatternOffsetY={-(project.baseFabricOffsetY ?? 0)}
                  fill={bgProcessedRef.current ? undefined : '#F4EFE7'}
                  onClick={() => { if (!drawMode) { onSelectLayer(null, false); onSelectAccessory(null) } }}
                />

                {/* Patch layers */}
                {!drawMode && sorted.map((pl) => {
                  const mask = getMaskById(pl.maskShapeId)
                  const fabric = getFabricById(pl.fabricTextureId)
                  if (!mask || !fabric) return null
                  return (
                    <PatchLayerNode
                      key={pl.id}
                      layer={pl}
                      maskShape={mask}
                      fabricImageUrl={fabric.processedImage}
                      onSelect={(add) => onSelectLayer(pl.id, add)}
                      onChange={(updates) => onUpdateLayer(pl.id, updates)}
                      onMount={(node) => {
                        if (node) layerNodeRefs.current.set(pl.id, node)
                        else layerNodeRefs.current.delete(pl.id)
                      }}
                    />
                  )
                })}

                {/* Surface accessories — on top of patches, clipped by template */}
                {!drawMode && surfaceAccessories.map((acc) => (
                  <AccessoryNode
                    key={acc.id}
                    accessory={acc}
                    isSelected={selectedAccessoryId === acc.id}
                    onSelect={() => onSelectAccessory(acc.id)}
                    onChange={(updates) => onUpdateAccessory(acc.id, updates)}
                    onMount={(node) => {
                      if (node) accessoryNodeRefs.current.set(acc.id, node)
                      else accessoryNodeRefs.current.delete(acc.id)
                    }}
                  />
                ))}

                {/* Free draw polygon preview — coordinates are canvas-local */}
                {drawMode && drawnPoints.length >= 2 && (
                  <>
                    <Line
                      points={drawnPoints}
                      stroke="#D8A7B1" strokeWidth={2}
                      dash={[5, 3]} fill="rgba(216,167,177,0.15)"
                      closed={false} listening={false}
                    />
                    {Array.from({ length: drawnPoints.length / 2 }, (_, i) => (
                      <Circle key={i}
                        name="draw-anchor"
                        x={drawnPoints[i * 2]} y={drawnPoints[i * 2 + 1]}
                        radius={5} fill="#D8A7B1" stroke="white" strokeWidth={1.5}
                        draggable
                        onDragEnd={(e) => onMoveDrawPoint?.(i, Math.round(e.target.x()), Math.round(e.target.y()))}
                      />
                    ))}
                    {drawnPoints.length >= 6 && (
                      <Circle x={drawnPoints[0]} y={drawnPoints[1]}
                        name="draw-anchor"
                        radius={8} fill="rgba(216,167,177,0.25)" stroke="#D8A7B1" strokeWidth={2}
                        onClick={(e) => { e.cancelBubble = true; onFinalizeDrawn?.() }}
                      />
                    )}
                  </>
                )}
              </Group>

              {/* Overlay accessories (strap, handle) — unclipped, arches over the template */}
              {!drawMode && (
                <Group x={CANVAS_PADDING} y={CANVAS_PADDING}>
                  {overlayAccessories.map((acc) => (
                    <AccessoryNode
                      key={acc.id}
                      accessory={acc}
                      isSelected={selectedAccessoryId === acc.id}
                      onSelect={() => onSelectAccessory(acc.id)}
                      onChange={(updates) => onUpdateAccessory(acc.id, updates)}
                      onMount={(node) => {
                        if (node) accessoryNodeRefs.current.set(acc.id, node)
                        else accessoryNodeRefs.current.delete(acc.id)
                      }}
                    />
                  ))}
                </Group>
              )}
            </Layer>

            {/* Layer 3: Transformer only — no clip, always on top */}
            <Layer>
              {!drawMode && (
                <Transformer
                  ref={transformerRef}
                  rotateEnabled keepRatio={false}
                  borderStroke="#D8A7B1" borderStrokeWidth={1.5}
                  anchorStroke="#D8A7B1" anchorFill="white"
                  anchorSize={9} anchorCornerRadius={3} rotateAnchorOffset={20}
                  boundBoxFunc={(oldBox, newBox) =>
                    (newBox.width < 20 || newBox.height < 20) ? oldBox : newBox
                  }
                  onTransformEnd={handleTransformEnd}
                />
              )}
            </Layer>
          </Stage>

          {/* Draw mode hint */}
          {drawMode && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
              <span className="text-[11px] text-white bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {drawnPoints.length < 4 ? '点击放置顶点' : drawnPoints.length < 6 ? '继续添加顶点' : '拖动顶点调整 · 点击首点或双击闭合 · Ctrl+Z 撤回'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
