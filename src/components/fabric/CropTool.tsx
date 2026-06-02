import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  imageUrl: string
  displaySize?: number
  outputSize?: number
  onCrop: (dataUrl: string) => void
}

const DEG = Math.PI / 180

export default function CropTool({
  imageUrl,
  displaySize = 380,
  outputSize = 800,
  onCrop,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [userScale, setUserScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)          // degrees
  const [fineRotation, setFineRotation] = useState(0)  // -180..180 fine-tune slider
  const drag = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)
  const touchRef = useRef<{ tx: number; ty: number; ox: number; oy: number } | null>(null)

  const coverScale = (img: HTMLImageElement) =>
    Math.max(displaySize / img.naturalWidth, displaySize / img.naturalHeight)

  // When rotation is active, loosen the clamp to let user freely position the rotated image
  const clamp = useCallback(
    (ox: number, oy: number, img: HTMLImageElement, us: number, rot: number) => {
      const ds = coverScale(img) * us
      const rad = Math.abs(rot * DEG)
      // Bounding box of rotated image
      const bw = img.naturalWidth * ds * Math.abs(Math.cos(rad)) + img.naturalHeight * ds * Math.abs(Math.sin(rad))
      const bh = img.naturalWidth * ds * Math.abs(Math.sin(rad)) + img.naturalHeight * ds * Math.abs(Math.cos(rad))
      const maxX = Math.max(0, (bw - displaySize) / 2)
      const maxY = Math.max(0, (bh - displaySize) / 2)
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      }
    },
    [displaySize],
  )

  const totalRotation = rotation + fineRotation

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, displaySize, displaySize)

    // Background so rotated gaps show clearly
    ctx.fillStyle = '#F4EFE7'
    ctx.fillRect(0, 0, displaySize, displaySize)

    const ds = coverScale(img) * userScale
    const w = img.naturalWidth * ds
    const h = img.naturalHeight * ds

    ctx.save()
    ctx.translate(displaySize / 2 + offset.x, displaySize / 2 + offset.y)
    ctx.rotate(totalRotation * DEG)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()

    // White corner brackets
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2.5
    const L = 20
    ;([
      [0, 0, 1, 1], [displaySize, 0, -1, 1],
      [0, displaySize, 1, -1], [displaySize, displaySize, -1, -1],
    ] as [number, number, number, number][]).forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath()
      ctx.moveTo(cx + sx * L, cy)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx, cy + sy * L)
      ctx.stroke()
    })
  }, [displaySize, offset, userScale, totalRotation])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setUserScale(1); setOffset({ x: 0, y: 0 })
      setRotation(0); setFineRotation(0)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => { draw() }, [draw])

  // --- Mouse drag ---
  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current || !imgRef.current) return
    const ox = drag.current.ox + e.clientX - drag.current.mx
    const oy = drag.current.oy + e.clientY - drag.current.my
    setOffset(clamp(ox, oy, imgRef.current, userScale, totalRotation))
  }
  const onMouseUp = () => { drag.current = null }

  // --- Touch drag ---
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchRef.current = { tx: t.clientX, ty: t.clientY, ox: offset.x, oy: offset.y }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!touchRef.current || !imgRef.current) return
    const t = e.touches[0]
    const ox = touchRef.current.ox + t.clientX - touchRef.current.tx
    const oy = touchRef.current.oy + t.clientY - touchRef.current.ty
    setOffset(clamp(ox, oy, imgRef.current, userScale, totalRotation))
  }
  const onTouchEnd = () => { touchRef.current = null }

  // --- Scroll to zoom ---
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const next = Math.max(0.5, Math.min(8, userScale * (e.deltaY < 0 ? 1.06 : 0.94)))
    setUserScale(next)
    if (imgRef.current) setOffset(clamp(offset.x, offset.y, imgRef.current, next, totalRotation))
  }

  const onScaleChange = (v: number) => {
    setUserScale(v)
    if (imgRef.current) setOffset(clamp(offset.x, offset.y, imgRef.current, v, totalRotation))
  }

  // Quick-rotate snaps rotation to nearest 90° multiple
  const quickRotate = (delta: number) => {
    const next = rotation + delta
    setRotation(next)
    setFineRotation(0)
    if (imgRef.current) setOffset(clamp(offset.x, offset.y, imgRef.current, userScale, next))
  }

  const onFineRotate = (v: number) => {
    setFineRotation(v)
    if (imgRef.current) setOffset(clamp(offset.x, offset.y, imgRef.current, userScale, rotation + v))
  }

  // --- Apply crop: same transform as draw(), scaled to outputSize ---
  const handleApply = () => {
    const img = imgRef.current
    if (!img) return
    const ds = coverScale(img) * userScale
    const w = img.naturalWidth * ds
    const h = img.naturalHeight * ds
    const s = outputSize / displaySize

    const out = document.createElement('canvas')
    out.width = outputSize
    out.height = outputSize
    const octx = out.getContext('2d')!
    octx.fillStyle = '#F4EFE7'
    octx.fillRect(0, 0, outputSize, outputSize)
    octx.save()
    octx.translate((displaySize / 2 + offset.x) * s, (displaySize / 2 + offset.y) * s)
    octx.rotate(totalRotation * DEG)
    octx.drawImage(img, -w * s / 2, -h * s / 2, w * s, h * s)
    octx.restore()
    onCrop(out.toDataURL('image/jpeg', 0.92))
  }

  const displayDeg = Math.round(((totalRotation % 360) + 360) % 360)

  return (
    <div className="space-y-3">
      {/* Crop canvas */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-card border border-border"
        style={{ width: displaySize, height: displaySize, maxWidth: '100%' }}
      >
        <canvas
          ref={canvasRef}
          width={displaySize}
          height={displaySize}
          className="block cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none', maxWidth: '100%' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-3 opacity-60">
          <span className="text-white text-[11px] bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm select-none">
            拖动 · 滚轮缩放 · {displayDeg}°
          </span>
        </div>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-secondary w-8 shrink-0">🔍 缩放</span>
        <input type="range" min={0.5} max={8} step={0.01} value={userScale}
          onChange={(e) => onScaleChange(Number(e.target.value))}
          className="flex-1 accent-primary" />
        <span className="text-[11px] text-text-secondary w-8 text-right">{userScale.toFixed(1)}×</span>
      </div>

      {/* Rotation */}
      <div className="bg-background rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-text-secondary">↻ 旋转</span>
          <span className="text-[11px] text-primary font-semibold">{displayDeg}°</span>
        </div>

        {/* Quick-rotate buttons */}
        <div className="flex gap-1.5">
          {[
            { label: '0°', action: () => { setRotation(0); setFineRotation(0) } },
            { label: '+90°', action: () => quickRotate(90) },
            { label: '+180°', action: () => quickRotate(180) },
            { label: '-90°', action: () => quickRotate(-90) },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              className="flex-1 py-1 rounded-lg border border-border bg-card text-[11px] text-text-secondary hover:border-primary/30 hover:text-primary transition-all">
              {label}
            </button>
          ))}
        </div>

        {/* Fine-tune slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-secondary shrink-0">微调</span>
          <input type="range" min={-45} max={45} step={0.5} value={fineRotation}
            onChange={(e) => onFineRotate(Number(e.target.value))}
            className="flex-1 accent-primary" />
          <span className="text-[10px] text-text-secondary w-10 text-right">
            {fineRotation >= 0 ? '+' : ''}{fineRotation.toFixed(1)}°
          </span>
        </div>
      </div>

      {/* Confirm */}
      <button onClick={handleApply}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-soft">
        确认裁剪 →
      </button>
    </div>
  )
}
