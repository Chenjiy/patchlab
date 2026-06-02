import type { FabricTexture } from '../../types'
import { MATERIAL_LABELS, PATTERN_LABELS } from '../../utils/colors'

interface Props {
  fabric: FabricTexture
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
  onSelect?: (fabric: FabricTexture) => void
  selected?: boolean
  compact?: boolean
}

export default function FabricCard({ fabric, onDelete, onEdit, onSelect, selected, compact }: Props) {
  return (
    <div
      onClick={() => onSelect?.(fabric)}
      className={`bg-card rounded-2xl border transition-all duration-200 overflow-hidden group
        ${onSelect ? 'cursor-pointer' : ''}
        ${selected ? 'border-primary shadow-card-hover ring-2 ring-primary/20' : 'border-border shadow-soft hover:shadow-card-hover hover:-translate-y-0.5'}
        ${compact ? 'p-2' : 'p-4'}
      `}
    >
      {/* Fabric tile preview */}
      <div className="relative mb-2">
        {compact ? (
          <div
            className="w-16 h-16 rounded-xl mx-auto overflow-hidden"
            style={{
              backgroundImage: `url(${fabric.processedImage})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '64px 64px',
            }}
          />
        ) : (
          <div
            className="w-full aspect-square rounded-xl overflow-hidden"
            style={{
              backgroundImage: `url(${fabric.processedImage})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '96px 96px',
            }}
          />
        )}
        {selected && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px]">
            ✓
          </div>
        )}
      </div>

      {!compact && (
        <>
          <h3 className="font-semibold text-text-primary text-sm mb-2 truncate">{fabric.name}</h3>

          <div className="flex flex-wrap gap-1 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
              {MATERIAL_LABELS[fabric.material]}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/30 text-text-secondary">
              {PATTERN_LABELS[fabric.patternType]}
            </span>
          </div>

          {fabric.mainColors.length > 0 && (
            <div className="flex gap-1 mb-2">
              {fabric.mainColors.slice(0, 5).map((c) => (
                <div
                  key={c}
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}

          {fabric.sizeNote && (
            <p className="text-[11px] text-text-secondary mb-2">{fabric.sizeNote}</p>
          )}

          {(onEdit || onDelete) && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(fabric.id) }}
                  className="text-[11px] text-text-secondary/50 hover:text-primary"
                >
                  编辑
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(fabric.id) }}
                  className="text-[11px] text-text-secondary/50 hover:text-primary"
                >
                  删除
                </button>
              )}
            </div>
          )}
        </>
      )}

      {compact && (
        <p className="text-[10px] text-text-secondary text-center truncate mt-1 px-1">
          {fabric.name}
        </p>
      )}
    </div>
  )
}
