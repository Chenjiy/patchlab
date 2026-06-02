import type { Accessory, AccessoryType } from '../../types'
import { generateId } from '../../utils/id'

const ZIPPER_COLORS = [
  { name: '玫粉', value: '#E8B4BC' },
  { name: '荔枝', value: '#F2C4CE' },
  { name: '蔷薇', value: '#E8A0A8' },
  { name: '珊瑚', value: '#F0B8A0' },
  { name: '蜜桃', value: '#EDCAA8' },
  { name: '暖黄', value: '#F0DBA0' },
  { name: '柠檬', value: '#E4E0A0' },
  { name: '嫩绿', value: '#C8D8A4' },
  { name: '抹茶', value: '#B5C9A8' },
  { name: '青竹', value: '#A8C8B8' },
  { name: '薄荷', value: '#B0D4C8' },
  { name: '浅青', value: '#A4C8D0' },
  { name: '天蓝', value: '#A8C5D3' },
  { name: '水蓝', value: '#A8B8E0' },
  { name: '雾蓝', value: '#B0C0DC' },
  { name: '藤紫', value: '#C0B4DC' },
  { name: '薰衣草', value: '#C4B5D3' },
  { name: '玉粉', value: '#DECAD8' },
  { name: '纯白', value: '#FFFFFF' },
  { name: '米白', value: '#F0E6D0' },
  { name: '象牙', value: '#EDE8D8' },
  { name: '浅灰', value: '#CCC8C4' },
  { name: '烟灰', value: '#B0ACA8' },
  { name: '石墨', value: '#8C8884' },
  { name: '墨黑', value: '#4C4844' },
]

const PRESETS: { type: AccessoryType; label: string; icon: string; desc: string; defaultColor: string; width: number; height: number; cornerRadius?: number }[] = [
  { type: 'zipper', label: '拉链', icon: '🔗', desc: '马卡龙配色', defaultColor: '#E8B4BC', width: 120, height: 20 },
  { type: 'webbing', label: '织带', icon: '🎗️', desc: '米色侧边带', defaultColor: '#D4C5A9', width: 24, height: 100 },
  { type: 'strap', label: '包带', icon: '👜', desc: '弯弧提带', defaultColor: '#D4C5A9', width: 180, height: 80, cornerRadius: 18 },
  { type: 'handle', label: '提手', icon: '🤝', desc: '布料提手', defaultColor: '#D4C5A9', width: 140, height: 65, cornerRadius: 14 },
  { type: 'loop-tab', label: '挂耳', icon: '🏷️', desc: '侧面布料耳', defaultColor: '#D4C5A9', width: 28, height: 52 },
  { type: 'flap', label: '翻盖', icon: '📋', desc: '可圆角面料翻盖', defaultColor: '#D4C5A9', width: 160, height: 70, cornerRadius: 12 },
  { type: 'snap-button', label: '八合扣', icon: '🔘', desc: '金属磁扣', defaultColor: '#C4C4C4', width: 52, height: 52 },
  { type: 'd-ring', label: 'D环', icon: '⭕', desc: '金属连接环', defaultColor: '#C4C4C4', width: 32, height: 40 },
  { type: 'buckle', label: '插扣', icon: '🔒', desc: '侧开插扣', defaultColor: '#C4C4C4', width: 52, height: 34 },
]

interface Props {
  canvasWidth: number
  canvasHeight: number
  accessoryCount: number
  onAdd: (acc: Accessory) => void
}

export default function AccessoryPanel({ canvasWidth, canvasHeight, accessoryCount, onAdd }: Props) {
  const handleAdd = (preset: typeof PRESETS[number]) => {
    let w = preset.width
    let h = preset.height
    let defaultX = Math.round((canvasWidth - w) / 2)
    let defaultY = Math.round(canvasHeight * 0.06)
    if (preset.type === 'webbing') {
      defaultX = 0
      defaultY = Math.round((canvasHeight - h) / 2)
    } else if (preset.type === 'strap') {
      // Place so legs sit at top of bag — arch extends into the padding area above
      defaultX = Math.round((canvasWidth - w) / 2)
      defaultY = -Math.round(h * 0.6)
    } else if (preset.type === 'handle') {
      defaultX = Math.round((canvasWidth - w) / 2)
      defaultY = -Math.round(h * 0.6)
    } else if (preset.type === 'loop-tab') {
      defaultX = canvasWidth - 10
      defaultY = Math.round((canvasHeight - h) / 2)
    } else if (preset.type === 'flap') {
      w = canvasWidth
      defaultX = 0
      defaultY = 0
    } else if (preset.type === 'snap-button') {
      defaultX = Math.round((canvasWidth - w) / 2)
      defaultY = Math.round(canvasHeight * 0.35)
    }
    const acc: Accessory = {
      id: generateId(),
      type: preset.type,
      x: defaultX,
      y: defaultY,
      width: w,
      height: h,
      rotation: 0,
      color: preset.defaultColor,
      cornerRadius: preset.cornerRadius,
      zIndex: accessoryCount,
    }
    onAdd(acc)
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">添加配件</p>
      <div className="space-y-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.type}
            onClick={() => handleAdd(preset)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
          >
            <span className="text-xl">{preset.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary">{preset.label}</p>
              <p className="text-[10px] text-text-secondary">{preset.desc}</p>
            </div>
            <div
              className="w-6 h-6 rounded-full border border-border flex-shrink-0"
              style={{ backgroundColor: preset.defaultColor }}
            />
          </button>
        ))}
      </div>

      {/* Color reference */}
      <div>
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2">拉链色板</p>
        <div className="flex flex-wrap gap-1.5">
          {ZIPPER_COLORS.map((c) => (
            <div key={c.value} className="relative group">
              <div
                className="w-6 h-6 rounded-full border border-border cursor-default"
                style={{ backgroundColor: c.value }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {c.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { ZIPPER_COLORS }
