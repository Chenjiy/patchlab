import { useState, useEffect } from 'react'
import { CANVAS_TEMPLATES, PX_PER_CM } from '../../data/templates'
import type { TemplateType, CustomTemplate } from '../../types'
import { getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from '../../services/storageService'
import { generateId } from '../../utils/id'
import { roundedPolygonPath } from '../../utils/shapeUtils'

interface CustomParams {
  topCm: number
  bottomCm: number
  heightCm: number
  cornerMm: number
}

interface Props {
  selected: TemplateType
  canvasWidth: number
  canvasHeight: number
  customParams?: CustomParams
  onSelect: (t: TemplateType) => void
  onSizeChange: (w: number, h: number) => void
  onCustomParamsChange?: (params: CustomParams) => void
}

export default function TemplateSelector({
  selected,
  customParams, onSelect, onSizeChange, onCustomParamsChange,
}: Props) {
  const DEFAULT: CustomParams = { topCm: 10, bottomCm: 10, heightCm: 10, cornerMm: 0 }
  const init = customParams ?? DEFAULT

  const [showEditor, setShowEditor] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplate[]>([])
  const [top, setTop] = useState(init.topCm)
  const [bottom, setBottom] = useState(init.bottomCm)
  const [height, setHeight] = useState(init.heightCm)
  const [corner, setCorner] = useState(init.cornerMm)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    if (customParams) {
      setTop(customParams.topCm)
      setBottom(customParams.bottomCm)
      setHeight(customParams.heightCm)
      setCorner(customParams.cornerMm)
    }
  }, [customParams])

  useEffect(() => {
    if (showEditor) setSavedTemplates(getCustomTemplates())
  }, [showEditor])

  const handleTemplateClick = (id: TemplateType) => {
    onSelect(id)
    if (id === 'custom') {
      setShowEditor(true)
    } else {
      const t = CANVAS_TEMPLATES.find((t) => t.id === id)!
      onSizeChange(t.width, t.height)
    }
  }

  const commit = (t = top, b = bottom, h = height, c = corner) => {
    const tC = Math.max(1, Math.min(60, t))
    const bC = Math.max(1, Math.min(60, b))
    const hC = Math.max(1, Math.min(60, h))
    const cMm = Math.max(0, Math.min(30, c))
    setTop(tC); setBottom(bC); setHeight(hC); setCorner(cMm)
    const w = Math.round(Math.max(tC, bC) * PX_PER_CM)
    const hPx = Math.round(hC * PX_PER_CM)
    onSizeChange(w, hPx)
    onCustomParamsChange?.({ topCm: tC, bottomCm: bC, heightCm: hC, cornerMm: cMm })
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    const t: CustomTemplate = {
      id: generateId(),
      name: templateName.trim(),
      topCm: top, bottomCm: bottom, heightCm: height, cornerMm: corner,
    }
    await saveCustomTemplate(t)
    setSavedTemplates(getCustomTemplates())
    setTemplateName('')
  }

  const handleLoadTemplate = (t: CustomTemplate) => {
    commit(t.topCm, t.bottomCm, t.heightCm, t.cornerMm)
  }

  const handleDeleteTemplate = async (id: string) => {
    await deleteCustomTemplate(id)
    setSavedTemplates(getCustomTemplates())
  }

  const isTrapezoid = top !== bottom

  const dimLabel = selected === 'custom' && customParams
    ? `${customParams.topCm}×${customParams.heightCm}cm`
    : null

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {CANVAS_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTemplateClick(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all
              ${selected === t.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-card border-border text-text-secondary hover:border-primary/20'}`}
          >
            <span>{t.icon}</span>
            <span>{t.name}</span>
            <span className={`text-[10px] ${selected === t.id ? 'text-primary/70' : 'text-text-secondary/60'}`}>{t.description}</span>
          </button>
        ))}

        {selected === 'custom' && (
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
          >
            ✎ {dimLabel ?? '编辑尺寸'}
          </button>
        )}
      </div>

      {showEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowEditor(false)}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <div
            className="relative bg-card rounded-3xl shadow-2xl p-6 w-96 max-w-[90vw] border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-text-primary">自定义画布</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Saved templates */}
            {savedTemplates.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">已保存的模板</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedTemplates.map((st) => (
                    <div key={st.id} className="flex items-center">
                      <button
                        onClick={() => handleLoadTemplate(st)}
                        className="px-2.5 py-1 bg-background border border-border rounded-l-lg text-xs text-text-secondary hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {st.name}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(st.id)}
                        className="px-1.5 py-1 bg-background border border-l-0 border-border rounded-r-lg text-[11px] text-text-secondary/40 hover:text-primary hover:border-primary/40 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-border" />
              </div>
            )}

            {/* Shape preview + inputs */}
            <div className="flex gap-4 items-start mb-4">
              <div className="flex-shrink-0">
                <p className="text-[10px] text-text-secondary mb-1.5 text-center">形状预览</p>
                <div className="w-20 h-20 flex items-center justify-center bg-background rounded-2xl">
                  <ShapePreview topCm={top} bottomCm={bottom} heightCm={height} cornerMm={corner} />
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-2.5">
                <CmInput label="上宽 (cm)" value={top} onChange={setTop} onCommit={(v) => commit(v, bottom, height, corner)} />
                <CmInput label="下宽 (cm)" value={bottom} onChange={setBottom} onCommit={(v) => commit(top, v, height, corner)} />
                <CmInput label="高度 (cm)" value={height} onChange={setHeight} onCommit={(v) => commit(top, bottom, v, corner)} />
                <div>
                  <label className="text-[10px] text-text-secondary block mb-1">圆角 (mm)</label>
                  <input
                    type="number" min={0} max={30} step={1} value={corner}
                    onChange={(e) => setCorner(Number(e.target.value))}
                    onBlur={() => commit()}
                    onKeyDown={(e) => e.key === 'Enter' && commit()}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-text-secondary/60 mb-4 text-right">
              {Math.round(Math.max(top, bottom) * PX_PER_CM)} × {Math.round(height * PX_PER_CM)} px
              {isTrapezoid && <span className="ml-1.5 text-primary font-medium">梯形</span>}
            </div>

            {/* Save template */}
            <div className="border-t border-border pt-4 mb-4">
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">保存为模板</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="输入模板名称…"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-soft"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CmInput({ label, value, onChange, onCommit }: {
  label: string; value: number; onChange: (v: number) => void; onCommit: (v: number) => void
}) {
  return (
    <div>
      <label className="text-[10px] text-text-secondary block mb-1">{label}</label>
      <input
        type="number" min={1} max={60} step={0.5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={(e) => onCommit(Number(e.target.value))}
        onKeyDown={(e) => e.key === 'Enter' && onCommit(Number((e.target as HTMLInputElement).value))}
        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center text-text-primary focus:outline-none focus:border-primary/50"
      />
    </div>
  )
}

function ShapePreview({ topCm, bottomCm, heightCm, cornerMm }: {
  topCm: number; bottomCm: number; heightCm: number; cornerMm: number
}) {
  const W = 60
  const H = 60
  const maxDim = Math.max(topCm, bottomCm, heightCm, 1)
  const pw = W * (Math.max(topCm, bottomCm) / maxDim)
  const ph = H * (heightCm / maxDim)
  const ox = (W - pw) / 2
  const oy = (H - ph) / 2
  const isTrap = Math.abs(topCm - bottomCm) > 0.1
  const topW = (topCm / Math.max(topCm, bottomCm)) * pw
  const botW = (bottomCm / Math.max(topCm, bottomCm)) * pw
  const topX = ox + (pw - topW) / 2
  const botX = ox + (pw - botW) / 2
  // Scale corner radius to preview dimensions (cornerMm → px in real life → scale down to preview)
  const crPreview = cornerMm > 0 ? Math.min(cornerMm * 1.5, pw / 3, ph / 3) : 0

  if (cornerMm > 0) {
    const pts = isTrap
      ? [{ x: topX, y: oy }, { x: topX + topW, y: oy }, { x: botX + botW, y: oy + ph }, { x: botX, y: oy + ph }]
      : [{ x: ox, y: oy }, { x: ox + pw, y: oy }, { x: ox + pw, y: oy + ph }, { x: ox, y: oy + ph }]
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={roundedPolygonPath(pts, crPreview)} fill="#D8A7B1" opacity="0.8" />
      </svg>
    )
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {isTrap ? (
        <polygon
          points={`${topX},${oy} ${topX + topW},${oy} ${botX + botW},${oy + ph} ${botX},${oy + ph}`}
          fill="#D8A7B1" opacity="0.8"
        />
      ) : (
        <rect x={ox} y={oy} width={pw} height={ph} rx={crPreview} ry={crPreview} fill="#D8A7B1" opacity="0.8" />
      )}
    </svg>
  )
}
