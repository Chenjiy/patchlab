import { useEffect, useRef, useState } from 'react'
import { Group, Rect, Line, Circle, Shape } from 'react-konva'
import Konva from 'konva'
import type { PatchLayer, MaskShape } from '../../types'
import { drawSvgPath } from '../../utils/svgPath'
import { processImage } from '../../utils/imageProcessing'


interface Props {
  layer: PatchLayer
  maskShape: MaskShape
  fabricImageUrl: string
  onSelect: (addToSelection?: boolean) => void
  onChange: (updates: Partial<PatchLayer>) => void
  onMount: (node: Konva.Group | null) => void
}

export default function PatchLayerNode({
  layer,
  maskShape,
  fabricImageUrl,
  onSelect,
  onChange,
  onMount,
}: Props) {
  const groupRef = useRef<Konva.Group>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const processedRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null)
  const rectRef = useRef<Konva.Rect>(null)
  const satRef = useRef(layer.colorSaturation ?? 0)
  const briRef = useRef(layer.colorBrightness ?? 0)
  satRef.current = layer.colorSaturation ?? 0
  briRef.current = layer.colorBrightness ?? 0
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    onMount(groupRef.current)
    return () => onMount(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = fabricImageUrl
    img.onload = () => {
      imgRef.current = img
      processedRef.current = processImage(img, satRef.current, briRef.current)
      forceUpdate(n => n + 1)
      rectRef.current?.getLayer()?.batchDraw()
    }
  }, [fabricImageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const img = imgRef.current
    const rect = rectRef.current
    if (!img || !rect) return
    processedRef.current = processImage(img, layer.colorSaturation ?? 0, layer.colorBrightness ?? 0)
    rect.fillPatternImage(processedRef.current as HTMLImageElement)
    rect.getLayer()?.batchDraw()
  }, [layer.colorSaturation, layer.colorBrightness])

  const { width, height } = layer
  const scaleX = width / maskShape.defaultWidth
  const scaleY = height / maskShape.defaultHeight

  const makeClipFunc = () => (ctx: Konva.Context) => {
    const type = maskShape.type
    if (type === 'circle') {
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
    } else if (type === 'rect') {
      ctx.beginPath()
      ctx.rect(0, 0, width, height)
    } else if ((type === 'svg' || type === 'custom') && maskShape.svgPath) {
      drawSvgPath(ctx, maskShape.svgPath, scaleX, scaleY)
    } else {
      ctx.beginPath()
      ctx.rect(0, 0, width, height)
    }
  }

  const tileSize = 80 * layer.textureScale

  return (
    <Group
      ref={groupRef}
      x={layer.x}
      y={layer.y}
      width={width}
      height={height}
      rotation={layer.rotation}
      draggable
      clipFunc={makeClipFunc()}
      onClick={(e) => onSelect(e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)}
      onTap={() => onSelect(false)}
      onDragEnd={(e) => {
        onChange({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })
      }}
    >
      <Rect
        ref={rectRef}
        x={0}
        y={0}
        width={width}
        height={height}
        fillPatternImage={processedRef.current ?? undefined}
        fillPatternRepeat="repeat"
        fillPatternScaleX={tileSize / 512}
        fillPatternScaleY={tileSize / 512}
        fillPatternOffsetX={-layer.textureOffsetX}
        fillPatternOffsetY={-layer.textureOffsetY}
        fillPatternRotation={layer.textureRotation}
        fill={processedRef.current ? undefined : '#E8DED6'}
      />

      {layer.edgeStyle !== 'none' && (
        <EdgeShape
          maskShape={maskShape}
          w={width}
          h={height}
          scaleX={scaleX}
          scaleY={scaleY}
          edgeStyle={layer.edgeStyle}
          edgeColor={layer.edgeColor ?? '#8A7F78'}
          stitchSpacing={layer.stitchSpacing ?? 6}
        />
      )}
    </Group>
  )
}

interface EdgeProps {
  maskShape: MaskShape
  w: number
  h: number
  scaleX: number
  scaleY: number
  edgeStyle: PatchLayer['edgeStyle']
  edgeColor: string
  stitchSpacing: number
}

function EdgeShape({ maskShape, w, h, scaleX, scaleY, edgeStyle, edgeColor, stitchSpacing }: EdgeProps) {
  if (edgeStyle === 'none') return null

  const isSvg = (maskShape.type === 'svg' || maskShape.type === 'custom') && !!maskShape.svgPath
  const isCircle = maskShape.type === 'circle'
  const cx = w / 2
  const cy = h / 2
  const halfR = Math.min(w, h) / 2
  const dash = stitchSpacing * 0.5
  const gap = stitchSpacing * 0.6

  // ── SVG / custom polygon shapes: trace the actual path ──────────────────
  // The Group's clipFunc already clips to the mask shape, so a stroke at the path
  // boundary is naturally half-visible (outer half clipped). strokeWidth*2 = visible+clipped.
  if (isSvg) {
    const svgPath = maskShape.svgPath!
    // strokeWidth N → N/2 px visible inside the shape
    const makeSvgStroke = (sw: number, d: number[], offset?: number, op?: number) => (
      <Shape
        sceneFunc={(ctx, shape) => {
          drawSvgPath(ctx as any, svgPath, scaleX, scaleY)
          ;(ctx as any).strokeShape(shape)
        }}
        stroke={edgeColor} strokeWidth={sw}
        dash={d} dashOffset={offset} opacity={op}
        listening={false}
      />
    )

    if (edgeStyle === 'topstitch') {
      return makeSvgStroke(3, [dash, gap])
    }
    if (edgeStyle === 'double-topstitch') {
      // Outer row (3px) + inner row scaled down ~8px (approximated via wider stroke)
      const innerSx = scaleX * (w - 10) / w
      const innerSy = scaleY * (h - 10) / h
      return <>
        {makeSvgStroke(3, [dash, gap])}
        <Shape
          sceneFunc={(ctx, shape) => {
            drawSvgPath(ctx as any, svgPath, innerSx, innerSy)
            ;(ctx as any).strokeShape(shape)
          }}
          stroke={edgeColor} strokeWidth={2}
          dash={[dash, gap]} listening={false}
          x={5} y={5}
        />
      </>
    }
    if (edgeStyle === 'saddle-stitch') {
      const offset = (dash + gap) / 2
      return <>
        {makeSvgStroke(4, [dash, gap])}
        {makeSvgStroke(4, [dash, gap], offset, 0.55)}
      </>
    }
    if (edgeStyle === 'overlock') {
      return <>
        {makeSvgStroke(10, [dash * 0.5, gap * 0.7], undefined, 0.55)}
        {makeSvgStroke(2, [dash, gap * 1.5])}
      </>
    }
    return null
  }

  // ── Circle shapes ────────────────────────────────────────────────────────
  if (isCircle) {
    if (edgeStyle === 'topstitch') {
      return <Circle x={cx} y={cy} radius={halfR - 5}
        stroke={edgeColor} strokeWidth={1.5} dash={[dash, gap]} listening={false} />
    }
    if (edgeStyle === 'double-topstitch') {
      return <>
        <Circle x={cx} y={cy} radius={halfR - 3}
          stroke={edgeColor} strokeWidth={1} dash={[dash, gap]} listening={false} />
        <Circle x={cx} y={cy} radius={halfR - 8}
          stroke={edgeColor} strokeWidth={1} dash={[dash, gap]} listening={false} />
      </>
    }
    if (edgeStyle === 'saddle-stitch') {
      const r = halfR - 5
      const offset = (dash + gap) / 2
      return <>
        <Circle x={cx} y={cy} radius={r} stroke={edgeColor} strokeWidth={2} dash={[dash, gap]} listening={false} />
        <Circle x={cx} y={cy} radius={r} stroke={edgeColor} strokeWidth={2}
          dash={[dash, gap]} dashOffset={offset} listening={false} opacity={0.55} />
      </>
    }
    if (edgeStyle === 'overlock') {
      return <>
        <Circle x={cx} y={cy} radius={halfR - 1}
          stroke={edgeColor} strokeWidth={5} dash={[dash * 0.5, gap * 0.7]} listening={false} opacity={0.55} />
        <Circle x={cx} y={cy} radius={halfR - 4}
          stroke={edgeColor} strokeWidth={1.5} dash={[dash, gap * 1.5]} listening={false} />
      </>
    }
    return null
  }

  // ── Rectangle (and any other) shapes ─────────────────────────────────────
  if (edgeStyle === 'topstitch') {
    return <Rect x={5} y={5} width={w - 10} height={h - 10}
      stroke={edgeColor} strokeWidth={1.5} dash={[dash, gap]} fill="transparent" listening={false} />
  }
  if (edgeStyle === 'double-topstitch') {
    return <>
      <Rect x={3} y={3} width={w - 6} height={h - 6}
        stroke={edgeColor} strokeWidth={1} dash={[dash, gap]} fill="transparent" listening={false} />
      <Rect x={9} y={9} width={w - 18} height={h - 18}
        stroke={edgeColor} strokeWidth={1} dash={[dash, gap]} fill="transparent" listening={false} />
    </>
  }
  if (edgeStyle === 'saddle-stitch') {
    const i = 5
    const offset = (dash + gap) / 2
    return <>
      <Rect x={i} y={i} width={w - i * 2} height={h - i * 2}
        stroke={edgeColor} strokeWidth={2} dash={[dash, gap]} fill="transparent" listening={false} />
      <Rect x={i} y={i} width={w - i * 2} height={h - i * 2}
        stroke={edgeColor} strokeWidth={2} dash={[dash, gap]} dashOffset={offset}
        fill="transparent" listening={false} opacity={0.55} />
    </>
  }
  if (edgeStyle === 'overlock') {
    const zigPts = makeOverlockPoints(w, h, stitchSpacing)
    return <>
      <Line points={zigPts} stroke={edgeColor} strokeWidth={1.5} opacity={0.7} listening={false} />
      <Rect x={4} y={4} width={w - 8} height={h - 8}
        stroke={edgeColor} strokeWidth={1} dash={[dash * 0.7, gap * 1.3]}
        fill="transparent" listening={false} />
    </>
  }

  return null
}

function makeOverlockPoints(w: number, h: number, spacing: number): number[] {
  const amp = 5
  const step = Math.max(spacing / 2, 2)
  const pts: number[] = []

  let inward = false
  for (let x = 0; x <= w; x += step) {
    pts.push(Math.min(x, w), inward ? amp : 0)
    inward = !inward
  }
  for (let y = step; y <= h; y += step) {
    pts.push(inward ? w - amp : w, Math.min(y, h))
    inward = !inward
  }
  for (let x = w - step; x >= 0; x -= step) {
    pts.push(Math.max(x, 0), inward ? h - amp : h)
    inward = !inward
  }
  for (let y = h - step; y >= 0; y -= step) {
    pts.push(inward ? amp : 0, Math.max(y, 0))
    inward = !inward
  }

  return pts
}
