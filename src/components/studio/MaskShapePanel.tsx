import { useEffect, useState } from 'react'
import { MASK_SHAPES } from '../../data/maskShapes'
import { getCustomShapes, deleteCustomShape } from '../../services/storageService'
import type { MaskShape } from '../../types'

interface Props {
  selectedId: string | null
  onSelect: (shape: MaskShape) => void
  drawMode?: boolean
  editingShape?: boolean
  onStartDraw?: () => void
  onCancelDraw?: () => void
  onEditShape?: (shape: MaskShape) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  basic: '基础',
  cute: '可爱',
  craft: '手工',
  custom: '我的形状',
}

export default function MaskShapePanel({ selectedId, onSelect, drawMode, editingShape, onStartDraw, onCancelDraw, onEditShape }: Props) {
  const [customShapes, setCustomShapes] = useState<MaskShape[]>([])

  useEffect(() => {
    setCustomShapes(getCustomShapes())
  }, [drawMode]) // refresh when draw mode changes (a shape may have just been added)

  const allShapes = [...MASK_SHAPES, ...customShapes]
  const categories = Array.from(new Set(allShapes.map((s) => s.category)))

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteCustomShape(id)
    setCustomShapes(getCustomShapes())
  }

  return (
    <div className="h-full overflow-y-auto">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1">蒙版形状</p>

      {/* Draw free shape button */}
      {drawMode ? (
        <button
          onClick={onCancelDraw}
          className="w-full mb-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-xs font-medium text-primary flex items-center justify-center gap-1.5"
        >
          ✕ {editingShape ? '取消编辑' : '取消绘制'}
        </button>
      ) : (
        <button
          onClick={onStartDraw}
          className="w-full mb-3 py-2 rounded-xl border border-dashed border-primary/40 text-xs font-medium text-primary/80 hover:bg-primary/5 hover:border-primary/60 transition-all flex items-center justify-center gap-1.5"
        >
          ✏️ 自由绘制形状
        </button>
      )}

      {categories.map((cat) => {
        const shapes = allShapes.filter((s) => s.category === cat)
        if (shapes.length === 0) return null
        return (
          <div key={cat} className="mb-4">
            <p className="text-[10px] font-medium text-text-secondary/70 mb-1.5 px-1">{CATEGORY_LABELS[cat] ?? cat}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {shapes.map((shape) => (
                <div key={shape.id} className="relative group">
                  <button
                    onClick={() => onSelect(shape)}
                    className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all
                      ${selectedId === shape.id ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:border-primary/20 hover:bg-background'}`}
                  >
                    <ShapePreview shape={shape} selected={selectedId === shape.id} />
                    <span className={`text-[9px] font-medium leading-tight ${selectedId === shape.id ? 'text-primary' : 'text-text-secondary'}`}>
                      {shape.name}
                    </span>
                  </button>
                  {/* Edit / Delete buttons for custom shapes */}
                  {shape.category === 'custom' && (
                    <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                      {shape.rawPoints && onEditShape && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditShape(shape) }}
                          className="w-4 h-4 rounded-full bg-blue-400/80 text-white text-[8px] flex items-center justify-center"
                          title="编辑形状"
                        >
                          ✎
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, shape.id)}
                        className="w-4 h-4 rounded-full bg-primary/80 text-white text-[9px] flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {customShapes.length === 0 && !drawMode && (
        <p className="text-[10px] text-text-secondary/60 px-1 mt-1">
          绘制自定义形状后显示在这里。
        </p>
      )}
    </div>
  )
}

function ShapePreview({ shape, selected }: { shape: MaskShape; selected: boolean }) {
  const color = selected ? '#D8A7B1' : '#C4B7AA'
  const size = 32

  if (shape.type === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill={color} />
      </svg>
    )
  }
  if (shape.type === 'rect') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="2" y="2" width="28" height="28" fill={color} />
      </svg>
    )
  }
  if (shape.type === 'svg' && shape.svgPath) {
    const vw = shape.defaultWidth
    const vh = shape.defaultHeight
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet">
        <path d={shape.svgPath} fill={color} />
      </svg>
    )
  }
  if (shape.type === 'custom' && shape.svgPath) {
    const vw = shape.defaultWidth
    const vh = shape.defaultHeight
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet">
        <path d={shape.svgPath} fill={color} />
      </svg>
    )
  }
  return <div style={{ width: size, height: size, background: color, borderRadius: 4 }} />
}
