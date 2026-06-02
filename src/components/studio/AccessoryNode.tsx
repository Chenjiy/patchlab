import { useEffect, useRef } from 'react'
import { Group, Rect, Line, Circle, Shape } from 'react-konva'
import Konva from 'konva'
import type { Accessory } from '../../types'
import { getFabricById } from '../../services/storageService'
import { processImage } from '../../utils/imageProcessing'

interface Props {
  accessory: Accessory
  isSelected: boolean
  onSelect: () => void
  onChange: (updates: Partial<Accessory>) => void
  onMount: (node: Konva.Group | null) => void
}

const FABRIC_TYPES: Accessory['type'][] = ['loop-tab', 'flap', 'strap', 'handle']

export default function AccessoryNode({ accessory: acc, onSelect, onChange, onMount }: Props) {
  const groupRef = useRef<Konva.Group>(null)
  const fabricRectRef = useRef<Konva.Rect>(null)
  const fabricImgRef = useRef<HTMLImageElement | null>(null)
  const fabricImgIdRef = useRef<string | undefined>(undefined)

  // Stable refs so async onload always reads the latest sat/bri
  const satRef = useRef(acc.fabricSaturation ?? 0)
  const briRef = useRef(acc.fabricBrightness ?? 0)
  satRef.current = acc.fabricSaturation ?? 0
  briRef.current = acc.fabricBrightness ?? 0

  useEffect(() => {
    const node = groupRef.current
    onMount(node)
    return () => onMount(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!FABRIC_TYPES.includes(acc.type)) return
    const node = fabricRectRef.current
    if (!node) return

    if (!acc.fabricTextureId) {
      fabricImgRef.current = null
      fabricImgIdRef.current = undefined
      node.fillPriority('color')
      node.getLayer()?.batchDraw()
      return
    }

    const apply = (img: HTMLImageElement) => {
      const baseTileSize = acc.type === 'flap' ? 80 : 60
      const tileSize = baseTileSize * (acc.fabricScale ?? 1)
      const processed = processImage(img, satRef.current, briRef.current)
      node.fillPatternImage(processed as HTMLImageElement)
      node.fillPatternRepeat('repeat')
      node.fillPatternScaleX(tileSize / 512)
      node.fillPatternScaleY(tileSize / 512)
      node.fillPriority('pattern')
      node.getLayer()?.batchDraw()
    }

    // Same texture already loaded — just reprocess with new sat/bri/scale
    if (fabricImgIdRef.current === acc.fabricTextureId && fabricImgRef.current) {
      apply(fabricImgRef.current)
      return
    }

    // New texture — load then apply
    const fabric = getFabricById(acc.fabricTextureId)
    if (!fabric?.processedImage) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = fabric.processedImage
    img.onload = () => {
      fabricImgRef.current = img
      fabricImgIdRef.current = acc.fabricTextureId
      apply(img)
    }
  }, [acc.type, acc.fabricTextureId, acc.fabricScale, acc.fabricSaturation, acc.fabricBrightness])

  const { width: w, height: h, color } = acc

  return (
    <Group
      ref={groupRef}
      x={acc.x}
      y={acc.y}
      width={w}
      height={h}
      rotation={acc.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
    >
      {acc.type === 'zipper' && <ZipperShape w={w} h={h} color={color} />}
      {acc.type === 'webbing' && <WebbingShape w={w} h={h} color={color} />}
      {acc.type === 'loop-tab' && <LoopTabShape w={w} h={h} color={color} fabricRectRef={fabricRectRef} />}
      {acc.type === 'flap' && <FlapShape w={w} h={h} color={color} cornerRadius={acc.cornerRadius ?? 0} fabricRectRef={fabricRectRef} />}
      {acc.type === 'snap-button' && <SnapButtonShape w={w} h={h} color={color} />}
      {acc.type === 'strap' && <StrapShape w={w} h={h} color={color} fabricRectRef={fabricRectRef} thickness={acc.cornerRadius} />}
      {acc.type === 'handle' && <HandleShape w={w} h={h} color={color} fabricRectRef={fabricRectRef} thickness={acc.cornerRadius} />}
      {acc.type === 'd-ring' && <DRingShape w={w} h={h} color={color} />}
      {acc.type === 'buckle' && <BuckleShape w={w} h={h} color={color} />}
    </Group>
  )
}

function ZipperShape({ w, h, color }: { w: number; h: number; color: string }) {
  const numTeeth = Math.max(2, Math.floor(w / 8))
  const toothSpacing = w / numTeeth
  const teethY = h / 2 - 3

  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={color} cornerRadius={2} />
      <Rect x={0} y={0} width={w} height={3} fill="rgba(255,255,255,0.25)" listening={false} />
      <Rect x={0} y={h - 3} width={w} height={3} fill="rgba(0,0,0,0.15)" listening={false} />
      <Line points={[6, h / 2, w - 6, h / 2]} stroke="rgba(0,0,0,0.2)" strokeWidth={1} dash={[2, 2]} listening={false} />
      {Array.from({ length: numTeeth }, (_, i) => (
        <Rect key={i}
          x={i * toothSpacing + toothSpacing / 2 - 2.5} y={teethY}
          width={5} height={6} fill="rgba(0,0,0,0.35)" cornerRadius={1} listening={false}
        />
      ))}
      <Rect x={-6} y={-3} width={10} height={h + 6} fill="rgba(0,0,0,0.3)" cornerRadius={2} listening={false} />
      <Circle x={-10} y={h / 2} radius={4} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} fill="transparent" listening={false} />
    </>
  )
}

function WebbingShape({ w, h, color }: { w: number; h: number; color: string }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={color} />
      <Rect x={0} y={0} width={w} height={2} fill="rgba(255,255,255,0.3)" listening={false} />
      <Line points={[4, 4, 4, h - 4]} stroke="rgba(0,0,0,0.18)" strokeWidth={1} dash={[4, 3]} listening={false} />
      <Line points={[w - 4, 4, w - 4, h - 4]} stroke="rgba(0,0,0,0.18)" strokeWidth={1} dash={[4, 3]} listening={false} />
      {Array.from({ length: Math.floor(h / 12) }, (_, i) => (
        <Line key={i} points={[3, (i + 0.5) * 12, w - 3, (i + 0.5) * 12]}
          stroke="rgba(0,0,0,0.08)" strokeWidth={1} listening={false} />
      ))}
    </>
  )
}

function LoopTabShape({ w, h, color, fabricRectRef }: {
  w: number; h: number; color: string
  fabricRectRef: React.RefObject<Konva.Rect | null>
}) {
  return (
    <>
      <Rect ref={fabricRectRef} x={0} y={0} width={w} height={h} fill={color} cornerRadius={4} />
      <Line points={[3, h / 2, w - 3, h / 2]} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} dash={[4, 3]} listening={false} />
      <Rect x={3} y={3} width={w - 6} height={h - 6} stroke="rgba(0,0,0,0.2)" strokeWidth={1.5} dash={[3, 2]} fill="transparent" listening={false} />
    </>
  )
}

function FlapShape({ w, h, color, cornerRadius: cr, fabricRectRef }: {
  w: number; h: number; color: string; cornerRadius: number
  fabricRectRef: React.RefObject<Konva.Rect | null>
}) {
  const innerCr = Math.max(0, cr - 4)
  return (
    <>
      <Rect ref={fabricRectRef} x={0} y={0} width={w} height={h} fill={color} cornerRadius={[0, 0, cr, cr]} />
      <Rect x={0} y={0} width={w} height={5} fill="rgba(0,0,0,0.1)" listening={false} />
      <Rect x={6} y={10} width={w - 12} height={h - 16}
        stroke="rgba(0,0,0,0.2)" strokeWidth={1.5} dash={[4, 3]} fill="transparent"
        cornerRadius={[0, 0, innerCr, innerCr]} listening={false} />
    </>
  )
}

function SnapButtonShape({ w, h, color }: { w: number; h: number; color: string }) {
  const r = Math.min(w, h) / 2
  const cx = w / 2
  const cy = h / 2

  return (
    <>
      <Circle x={cx} y={cy} radius={r} fill={color} />
      <Circle x={cx} y={cy} radius={r * 0.82} fill="rgba(255,255,255,0.12)" listening={false} />
      <Circle x={cx} y={cy} radius={r * 0.58} fill={color} stroke="rgba(0,0,0,0.22)" strokeWidth={1.5} listening={false} />
      <Circle x={cx - r * 0.14} y={cy - r * 0.14} radius={r * 0.18} fill="rgba(255,255,255,0.5)" listening={false} />
      <Line points={[cx - r * 0.22, cy, cx + r * 0.22, cy]} stroke="rgba(0,0,0,0.28)" strokeWidth={1.5} listening={false} />
      <Line points={[cx, cy - r * 0.22, cx, cy + r * 0.22]} stroke="rgba(0,0,0,0.28)" strokeWidth={1.5} listening={false} />
      <Circle x={cx} y={cy} radius={r - 0.75} fill="transparent" stroke="rgba(0,0,0,0.18)" strokeWidth={1} listening={false} />
    </>
  )
}

// ── New accessory shapes ──────────────────────────────────────────────────────

function StrapShape({ w, h, color, fabricRectRef, thickness }: {
  w: number; h: number; color: string
  fabricRectRef: React.RefObject<Konva.Rect | null>
  thickness?: number
}) {
  const t = thickness ?? Math.max(14, Math.round(Math.min(w * 0.1, 30)))
  const legH = Math.round(h * 0.38)                          // straight leg portion at bottom
  const inset = t * 0.22

  // Clip the fabric Rect into a hollow arch shape
  const archClip = (ctx: any) => {
    ctx.beginPath()
    // Outer arch: bottom-left → up left → bezier across top → down right → bottom-right
    ctx.moveTo(0, h)
    ctx.lineTo(0, h - legH)
    ctx.bezierCurveTo(0, 0, w, 0, w, h - legH)
    ctx.lineTo(w, h)
    // Inner arch cutout (reverse): bottom-right inner → up right inner → bezier across inner top → down left inner
    ctx.lineTo(w - t, h)
    ctx.lineTo(w - t, h - legH + t * 0.4)
    ctx.bezierCurveTo(w - t, t, t, t, t, h - legH + t * 0.4)
    ctx.lineTo(t, h)
    ctx.closePath()
  }

  return (
    <>
      {/* Transparent hit-test rect covers full bounding box — clipFunc would restrict hit area to ring only */}
      <Rect x={0} y={0} width={w} height={h} fill="transparent" />
      {/* Fabric-filled arch body — listening={false} so hit area stays on the transparent rect above */}
      <Group clipFunc={archClip} listening={false}>
        <Rect ref={fabricRectRef} x={0} y={0} width={w} height={h} fill={color} />
        <Rect x={0} y={0} width={w} height={t * 0.35} fill="rgba(255,255,255,0.22)" />
      </Group>
      {/* Topstitch along outer arch */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.moveTo(inset, h)
          ctx.lineTo(inset, h - legH + inset)
          ctx.bezierCurveTo(inset, inset, w - inset, inset, w - inset, h - legH + inset)
          ctx.lineTo(w - inset, h)
          ;(ctx as any).strokeShape(shape)
        }}
        stroke="rgba(0,0,0,0.18)" strokeWidth={1} dash={[5, 3]} listening={false}
      />
      {/* Topstitch along inner arch */}
      <Shape
        sceneFunc={(ctx, shape) => {
          const ii = t - inset
          ctx.beginPath()
          ctx.moveTo(ii, h)
          ctx.lineTo(ii, h - legH + ii * 0.5)
          ctx.bezierCurveTo(ii, ii, w - ii, ii, w - ii, h - legH + ii * 0.5)
          ctx.lineTo(w - ii, h)
          ;(ctx as any).strokeShape(shape)
        }}
        stroke="rgba(0,0,0,0.14)" strokeWidth={1} dash={[5, 3]} listening={false}
      />
    </>
  )
}

function HandleShape({ w, h, color, fabricRectRef, thickness }: {
  w: number; h: number; color: string
  fabricRectRef: React.RefObject<Konva.Rect | null>
  thickness?: number
}) {
  const t = thickness ?? Math.min(Math.round(h * 0.32), 18)
  const tabW = Math.min(18, Math.round(w * 0.16))
  const archH = h - t

  return (
    <>
      {/* Arch bar — the part you grab */}
      <Rect ref={fabricRectRef} x={0} y={0} width={w} height={t} fill={color} cornerRadius={t / 2} />
      {/* Left attachment tab */}
      <Rect x={4} y={t - 3} width={tabW} height={archH + 3} fill={color} cornerRadius={[0, 0, 4, 4]} />
      {/* Right attachment tab */}
      <Rect x={w - tabW - 4} y={t - 3} width={tabW} height={archH + 3} fill={color} cornerRadius={[0, 0, 4, 4]} />
      {/* Arch topstitch */}
      <Line points={[t, t / 2, w - t, t / 2]} stroke="rgba(0,0,0,0.18)" strokeWidth={1} dash={[4, 3]} listening={false} />
      {/* Tab stitching — left */}
      <Rect x={6} y={t + 4} width={tabW - 4} height={archH - 8}
        stroke="rgba(0,0,0,0.2)" strokeWidth={1} dash={[3, 2]} fill="transparent" cornerRadius={2} listening={false} />
      {/* Tab stitching — right */}
      <Rect x={w - tabW - 2} y={t + 4} width={tabW - 4} height={archH - 8}
        stroke="rgba(0,0,0,0.2)" strokeWidth={1} dash={[3, 2]} fill="transparent" cornerRadius={2} listening={false} />
    </>
  )
}

function DRingShape({ w, h, color }: { w: number; h: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const outerR = Math.min(cx, cy) - 1
  const ringThickness = Math.max(4, Math.round(outerR * 0.28))

  return (
    <>
      {/* Ring stroke */}
      <Circle x={cx} y={cy} radius={outerR} stroke={color} strokeWidth={ringThickness} fill="transparent" />
      {/* Flat bar (D's straight side) */}
      <Rect
        x={cx - outerR - ringThickness / 2} y={cy - ringThickness / 2}
        width={ringThickness} height={ringThickness}
        fill={color} listening={false}
      />
      <Rect
        x={cx - outerR - ringThickness / 2} y={cy - outerR}
        width={ringThickness} height={outerR * 2}
        fill={color} listening={false}
      />
      {/* Metal sheen */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.arc(cx, cy, outerR - ringThickness * 0.3, -Math.PI * 0.6, -Math.PI * 0.1)
          ;(ctx as any).strokeShape(shape)
        }}
        stroke="rgba(255,255,255,0.45)" strokeWidth={ringThickness * 0.4} listening={false}
      />
    </>
  )
}

function BuckleShape({ w, h, color }: { w: number; h: number; color: string }) {
  const frame = Math.max(4, Math.round(Math.min(w, h) * 0.14))
  const slotW = Math.round((w - frame * 2 - 3) / 2)
  const slotH = h - frame * 2

  return (
    <>
      {/* Outer frame */}
      <Rect x={0} y={0} width={w} height={h} fill={color} cornerRadius={4} />
      {/* Left slot cutout */}
      <Rect x={frame} y={frame} width={slotW} height={slotH} fill="#F4EFE7" cornerRadius={2} listening={false} />
      {/* Right slot cutout */}
      <Rect x={frame + slotW + 3} y={frame} width={slotW} height={slotH} fill="#F4EFE7" cornerRadius={2} listening={false} />
      {/* Top highlight */}
      <Rect x={2} y={2} width={w - 4} height={3} fill="rgba(255,255,255,0.3)" cornerRadius={2} listening={false} />
      {/* Bottom shadow */}
      <Rect x={2} y={h - 4} width={w - 4} height={3} fill="rgba(0,0,0,0.12)" cornerRadius={2} listening={false} />
      {/* Press-release button nub */}
      <Rect
        x={Math.round(w / 2) - 4} y={-5}
        width={8} height={8}
        fill={color} cornerRadius={[2, 2, 0, 0]} listening={false}
      />
    </>
  )
}
