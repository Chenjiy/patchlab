import type { Accessory, FabricTexture } from '../../types'
import { ZIPPER_COLORS } from './AccessoryPanel'

const WEBBING_COLORS = [
  { name: '纯白', value: '#FFFFFF' },
  { name: '米色', value: '#D4C5A9' },
  { name: '白色', value: '#F0EDE8' },
  { name: '黑色', value: '#4A4644' },
  { name: '棕色', value: '#9C7A5A' },
  { name: '藏青', value: '#6B8EA8' },
  { name: '橄榄', value: '#8C9A72' },
]

const SNAP_COLORS = [
  { name: '银色', value: '#C4C4C4' },
  { name: '哑银', value: '#A8A8A8' },
  { name: '金色', value: '#D4A840' },
  { name: '古铜', value: '#A87040' },
  { name: '玫金', value: '#D4A090' },
  { name: '枪黑', value: '#6A6870' },
]

const FLAP_COLORS = [
  { name: '纯白', value: '#FFFFFF' },
  { name: '米色', value: '#D4C5A9' },
  { name: '白色', value: '#F0EDE8' },
  { name: '黑色', value: '#4A4644' },
  { name: '棕色', value: '#9C7A5A' },
  { name: '玫粉', value: '#E8B4BC' },
  { name: '天蓝', value: '#A8C5D3' },
  { name: '抹茶', value: '#B5C9A8' },
  { name: '藤紫', value: '#C0B4DC' },
]

interface Props {
  accessory: Accessory
  fabrics: FabricTexture[]
  onUpdate: (updates: Partial<Accessory>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const LABEL_MAP: Record<Accessory['type'], string> = {
  zipper: '拉链',
  webbing: '织带',
  'loop-tab': '挂耳',
  flap: '翻盖',
  'snap-button': '八合扣',
  strap: '包带',
  handle: '提手',
  'd-ring': 'D环',
  buckle: '插扣',
}

const ICON_MAP: Record<Accessory['type'], string> = {
  zipper: '🔗',
  webbing: '🎗️',
  'loop-tab': '🏷️',
  flap: '📋',
  'snap-button': '🔘',
  strap: '👜',
  handle: '🤝',
  'd-ring': '⭕',
  buckle: '🔒',
}

const N = ({ label, value, onChange, min = 0, max = 800, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) => (
  <div>
    <label className="text-[11px] text-text-secondary block mb-0.5">{label}</label>
    <input
      type="number" value={Math.round(value)} min={min} max={max} step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-text-primary focus:outline-none focus:border-primary/50"
    />
  </div>
)

export default function AccessoryPropertyPanel({ accessory: acc, fabrics, onUpdate, onDelete, onMoveUp, onMoveDown }: Props) {
  const showFabric = acc.type === 'loop-tab' || acc.type === 'flap' || acc.type === 'strap' || acc.type === 'handle'
  const colorPalette =
    acc.type === 'zipper' ? ZIPPER_COLORS :
    acc.type === 'webbing' || acc.type === 'strap' || acc.type === 'handle' ? WEBBING_COLORS :
    acc.type === 'flap' || acc.type === 'loop-tab' ? FLAP_COLORS :
    acc.type === 'snap-button' || acc.type === 'd-ring' || acc.type === 'buckle' ? SNAP_COLORS :
    null

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="bg-background rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl">
            {ICON_MAP[acc.type]}
          </div>
          <p className="text-xs font-semibold text-text-primary">{LABEL_MAP[acc.type]}</p>
        </div>
      </div>

      {/* Color palette */}
      {colorPalette && (
        <section>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">颜色</p>
          <div className="flex flex-wrap gap-2">
            {colorPalette.map((c) => (
              <button
                key={c.value}
                title={c.name}
                onClick={() => onUpdate({ color: c.value })}
                className={`w-7 h-7 rounded-full border-2 transition-all ${acc.color === c.value ? 'border-primary scale-110 shadow-sm' : 'border-border/50 hover:border-primary/40'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <input
              type="color"
              value={acc.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-7 h-7 rounded-full cursor-pointer border-2 border-border/50"
              title="自定义颜色"
            />
          </div>
        </section>
      )}

      {/* Fabric selector for loop-tab and flap */}
      {showFabric && (
        <section>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">面料填充</p>
          <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
            {fabrics.map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdate({ fabricTextureId: f.id })}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${acc.fabricTextureId === f.id ? 'border-primary' : 'border-transparent hover:border-primary/30'}`}
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${f.processedImage})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '24px 24px',
                  }}
                />
                {acc.fabricTextureId === f.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          {acc.fabricTextureId && (
            <button
              onClick={() => onUpdate({ fabricTextureId: undefined })}
              className="mt-1.5 text-[11px] text-text-secondary hover:text-primary transition-colors"
            >
              取消面料填充
            </button>
          )}
        </section>
      )}

      {/* Fabric scale for loop-tab and flap */}
      {showFabric && acc.fabricTextureId && (
        <section>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">面料缩放</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-secondary">小</span>
            <input
              type="range"
              min={0.3} max={3} step={0.05}
              value={acc.fabricScale ?? 1}
              onChange={(e) => onUpdate({ fabricScale: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-[10px] text-text-secondary">大</span>
            <span className="text-xs text-text-secondary w-9 text-right">{((acc.fabricScale ?? 1) * 100).toFixed(0)}%</span>
          </div>
        </section>
      )}

      {/* Fabric sat/bri */}
      {showFabric && acc.fabricTextureId && (
        <section className="space-y-2">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">面料色调</p>
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[11px] text-text-secondary">饱和度</label>
              <span className="text-[11px] text-text-secondary">{((acc.fabricSaturation ?? 0) >= 0 ? '+' : '') + (acc.fabricSaturation ?? 0).toFixed(2)}</span>
            </div>
            <input type="range" min={-1} max={2} step={0.05}
              value={acc.fabricSaturation ?? 0}
              onChange={(e) => onUpdate({ fabricSaturation: Number(e.target.value) })}
              className="w-full accent-primary" />
          </div>
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[11px] text-text-secondary">亮度</label>
              <span className="text-[11px] text-text-secondary">{((acc.fabricBrightness ?? 0) >= 0 ? '+' : '') + (acc.fabricBrightness ?? 0).toFixed(2)}</span>
            </div>
            <input type="range" min={-1} max={1} step={0.05}
              value={acc.fabricBrightness ?? 0}
              onChange={(e) => onUpdate({ fabricBrightness: Number(e.target.value) })}
              className="w-full accent-primary" />
          </div>
          {((acc.fabricSaturation ?? 0) !== 0 || (acc.fabricBrightness ?? 0) !== 0) && (
            <button
              onClick={() => onUpdate({ fabricSaturation: 0, fabricBrightness: 0 })}
              className="text-[11px] text-text-secondary hover:text-primary transition-colors"
            >
              重置色调
            </button>
          )}
        </section>
      )}

      {/* Strap tube width for strap / handle */}
      {(acc.type === 'strap' || acc.type === 'handle') && (
        <section>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">带宽</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={6} max={60} step={1}
              value={acc.cornerRadius ?? 18}
              onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-text-secondary w-10 text-right">{acc.cornerRadius ?? 18} px</span>
          </div>
        </section>
      )}

      {/* Corner radius for flap */}
      {acc.type === 'flap' && (
        <section>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">圆角</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0} max={60} step={1}
              value={acc.cornerRadius ?? 0}
              onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-text-secondary w-10 text-right">{acc.cornerRadius ?? 0} px</span>
          </div>
        </section>
      )}

      {/* Size */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
          {acc.type === 'zipper' ? '长度 / 粗细' :
           acc.type === 'webbing' ? '宽度 / 长度' :
           acc.type === 'snap-button' ? '尺寸' :
           acc.type === 'strap' ? '带长 / 带宽' :
           acc.type === 'handle' ? '跨度 / 高度' :
           '宽度 / 高度'}
        </p>
        {acc.type === 'snap-button' ? (
          <N
            label="直径 (px)"
            value={acc.width}
            onChange={(v) => onUpdate({ width: Math.max(16, v), height: Math.max(16, v) })}
            min={16} max={200}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <N
              label={acc.type === 'zipper' ? '长 (px)' : '宽 (px)'}
              value={acc.width}
              onChange={(v) => onUpdate({ width: Math.max(10, v) })}
              min={10} max={600}
            />
            <N
              label={acc.type === 'zipper' ? '粗 (px)' : '高 (px)'}
              value={acc.height}
              onChange={(v) => onUpdate({ height: Math.max(6, v) })}
              min={6} max={400}
            />
          </div>
        )}
      </section>

      {/* Position */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">位置 / 旋转</p>
        <div className="grid grid-cols-2 gap-2">
          <N label="X" value={acc.x} onChange={(v) => onUpdate({ x: v })} min={-200} max={2000} />
          <N label="Y" value={acc.y} onChange={(v) => onUpdate({ y: v })} min={-200} max={2000} />
          <div className="col-span-2">
            <N label="旋转 (°)" value={acc.rotation} onChange={(v) => onUpdate({ rotation: v })} min={-180} max={180} />
          </div>
        </div>
      </section>

      {/* Layer order */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">图层顺序</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onMoveUp}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            ↑ 上移
          </button>
          <button
            onClick={onMoveDown}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            ↓ 下移
          </button>
        </div>
      </section>

      {/* Delete */}
      <section>
        <button
          onClick={onDelete}
          className="w-full px-3 py-2 rounded-xl bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-all"
        >
          删除配件
        </button>
      </section>
    </div>
  )
}
