import type { FabricTexture, PatchLayer } from '../../types'
import { getMaskById } from '../../data/maskShapes'
import { getFabricById } from '../../services/storageService'

interface BaseFabricProps {
  scale: number
  offsetX: number
  offsetY: number
  saturation: number
  brightness: number
  onUpdate: (updates: { scale?: number; offsetX?: number; offsetY?: number; saturation?: number; brightness?: number }) => void
}

interface Props {
  layer: PatchLayer | null
  selectedCount?: number
  fabrics: FabricTexture[]
  onUpdate: (updates: Partial<PatchLayer>) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  baseFabric?: BaseFabricProps
}

const N = ({ label, value, onChange, min = 0, max = 1000, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) => (
  <div>
    <label className="text-[11px] text-text-secondary block mb-0.5">{label}</label>
    <input
      type="number"
      value={Math.round(value * 100) / 100}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min} max={max} step={step}
      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-text-primary focus:outline-none focus:border-primary/50"
    />
  </div>
)

export default function LayerPropertyPanel({ layer, selectedCount = 0, fabrics, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, baseFabric }: Props) {
  if (!layer) {
    return (
      <div className="h-full overflow-y-auto p-4 space-y-5">
        {selectedCount > 1 && (
          <div className="bg-primary/8 rounded-2xl p-3 space-y-3">
            <p className="text-xs font-semibold text-text-primary text-center">已选中 {selectedCount} 个布块</p>
            <p className="text-[10px] text-text-secondary text-center">可拖动或使用控制框批量调整</p>
            <div className="space-y-2 pt-1">
              <button onClick={onDuplicate}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text-secondary hover:bg-background hover:border-primary/30 transition-all">
                复制所选
              </button>
              <button onClick={onDelete}
                className="w-full px-3 py-2 rounded-xl bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-all">
                删除所选
              </button>
            </div>
          </div>
        )}
        {baseFabric ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base">🧵</div>
              <p className="text-xs font-semibold text-text-primary">底布填充</p>
            </div>
            <section className="space-y-3">
              <div>
                <label className="text-[11px] text-text-secondary block mb-0.5">图块大小</label>
                <input
                  type="range" min={0.2} max={5} step={0.05}
                  value={baseFabric.scale}
                  onChange={(e) => baseFabric.onUpdate({ scale: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
                  <span>小</span>
                  <span>{baseFabric.scale.toFixed(2)}×</span>
                  <span>大</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <N label="偏移 X" value={baseFabric.offsetX} onChange={(v) => baseFabric.onUpdate({ offsetX: v })} min={-400} max={400} />
                <N label="偏移 Y" value={baseFabric.offsetY} onChange={(v) => baseFabric.onUpdate({ offsetY: v })} min={-400} max={400} />
              </div>
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[11px] text-text-secondary">饱和度</label>
                  <span className="text-[11px] text-text-secondary">
                    {(baseFabric.saturation >= 0 ? '+' : '') + baseFabric.saturation.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range" min={-1} max={2} step={0.05}
                  value={baseFabric.saturation}
                  onChange={(e) => baseFabric.onUpdate({ saturation: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[11px] text-text-secondary">亮度</label>
                  <span className="text-[11px] text-text-secondary">
                    {(baseFabric.brightness >= 0 ? '+' : '') + baseFabric.brightness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range" min={-1} max={1} step={0.05}
                  value={baseFabric.brightness}
                  onChange={(e) => baseFabric.onUpdate({ brightness: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <button
                onClick={() => baseFabric.onUpdate({ scale: 1, offsetX: 0, offsetY: 0, saturation: 0, brightness: 0 })}
                className="w-full py-1.5 rounded-lg border border-border text-[11px] text-text-secondary hover:bg-background transition-colors"
              >
                重置
              </button>
            </section>
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-text-secondary text-center">在画布上选中布块可编辑属性</p>
            </div>
          </>
        ) : selectedCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center text-3xl mb-3">✂️</div>
            <p className="text-sm text-text-secondary">在画布上选中布块来编辑属性</p>
          </div>
        ) : null}
      </div>
    )
  }

  const mask = getMaskById(layer.maskShapeId)
  const fabric = getFabricById(layer.fabricTextureId)

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* Info */}
      <div className="bg-background rounded-2xl p-3 space-y-1">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0"
            style={{
              backgroundImage: fabric ? `url(${fabric.processedImage})` : undefined,
              backgroundRepeat: 'repeat',
              backgroundSize: '40px 40px',
              backgroundColor: '#E8DED6',
            }}
          />
          <div>
            <p className="text-xs font-medium text-text-primary truncate">{fabric?.name ?? '未知面料'}</p>
            <p className="text-[11px] text-text-secondary">{mask?.name ?? '未知形状'}</p>
          </div>
        </div>
      </div>

      {/* Fabric selector */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">更换面料</p>
        <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
          {fabrics.map((f) => (
            <button
              key={f.id}
              onClick={() => onUpdate({ fabricTextureId: f.id })}
              title={f.name}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${layer.fabricTextureId === f.id ? 'border-primary' : 'border-transparent hover:border-primary/30'}`}
            >
              <div
                className="w-full h-full"
                style={{ backgroundImage: `url(${f.processedImage})`, backgroundRepeat: 'repeat', backgroundSize: '24px 24px' }}
              />
              {layer.fabricTextureId === f.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Position & size */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">变换</p>
        <div className="grid grid-cols-2 gap-2">
          <N label="X" value={layer.x} onChange={(v) => onUpdate({ x: v })} min={-500} max={2000} />
          <N label="Y" value={layer.y} onChange={(v) => onUpdate({ y: v })} min={-500} max={2000} />
          <N label="宽度" value={layer.width} onChange={(v) => onUpdate({ width: Math.max(20, v) })} min={20} max={800} />
          <N label="高度" value={layer.height} onChange={(v) => onUpdate({ height: Math.max(20, v) })} min={20} max={800} />
          <div className="col-span-2">
            <N label="旋转 (°)" value={layer.rotation} onChange={(v) => onUpdate({ rotation: v })} min={-180} max={180} />
          </div>
        </div>
      </section>

      {/* Texture */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">纹理</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[11px] text-text-secondary">饱和度</label>
              <span className="text-[11px] text-text-secondary">
                {((layer.colorSaturation ?? 0) >= 0 ? '+' : '') + (layer.colorSaturation ?? 0).toFixed(2)}
              </span>
            </div>
            <input
              type="range" min={-1} max={2} step={0.05}
              value={layer.colorSaturation ?? 0}
              onChange={(e) => onUpdate({ colorSaturation: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
              <span>灰度</span>
              <span>鲜艳</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[11px] text-text-secondary">亮度</label>
              <span className="text-[11px] text-text-secondary">
                {((layer.colorBrightness ?? 0) >= 0 ? '+' : '') + (layer.colorBrightness ?? 0).toFixed(2)}
              </span>
            </div>
            <input
              type="range" min={-1} max={1} step={0.05}
              value={layer.colorBrightness ?? 0}
              onChange={(e) => onUpdate({ colorBrightness: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
              <span>暗</span>
              <span>亮</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-text-secondary block mb-0.5">缩放</label>
            <input
              type="range" min={0.1} max={4} step={0.05}
              value={layer.textureScale}
              onChange={(e) => onUpdate({ textureScale: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <span className="text-[11px] text-text-secondary">{layer.textureScale.toFixed(2)}×</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <N label="偏移 X" value={layer.textureOffsetX} onChange={(v) => onUpdate({ textureOffsetX: v })} min={-200} max={200} />
            <N label="偏移 Y" value={layer.textureOffsetY} onChange={(v) => onUpdate({ textureOffsetY: v })} min={-200} max={200} />
          </div>
          <div>
            <N label="纹理旋转 (°)" value={layer.textureRotation} onChange={(v) => onUpdate({ textureRotation: v })} min={-180} max={180} />
          </div>
        </div>
      </section>

      {/* Edge stitch style */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">线迹样式</p>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {([
            ['none', '无线迹'],
            ['topstitch', '明线'],
            ['double-topstitch', '双明线'],
            ['saddle-stitch', '马鞍线'],
            ['overlock', '锁边'],
          ] as [PatchLayer['edgeStyle'], string][]).map(([es, label]) => (
            <button
              key={es}
              onClick={() => onUpdate({ edgeStyle: es })}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all
                ${layer.edgeStyle === es ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-text-secondary hover:border-primary/20'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {layer.edgeStyle !== 'none' && (
          <div className="space-y-2.5">
            {/* Thread color */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-text-secondary flex-shrink-0">线色</label>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {['#8A7F78', '#4A4644', '#FFFFFF', '#F0EDE8', '#D8A7B1', '#A8C5D3', '#B5C9A8', '#D4A840', '#C4C4C4'].map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdate({ edgeColor: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${(layer.edgeColor ?? '#8A7F78') === c ? 'border-primary scale-110' : 'border-border/50 hover:border-primary/40'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={layer.edgeColor ?? '#8A7F78'}
                  onChange={(e) => onUpdate({ edgeColor: e.target.value })}
                  className="w-6 h-6 rounded-full cursor-pointer border border-border"
                  title="自定义颜色"
                />
              </div>
            </div>

            {/* Stitch spacing */}
            <div>
              <div className="flex justify-between mb-0.5">
                <label className="text-[11px] text-text-secondary">针距</label>
                <span className="text-[11px] text-text-secondary">{layer.stitchSpacing ?? 6} px</span>
              </div>
              <input
                type="range" min={2} max={20} step={1}
                value={layer.stitchSpacing ?? 6}
                onChange={(e) => onUpdate({ stitchSpacing: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
                <span>密</span>
                <span>疏</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Layer order */}
      <section>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">图层顺序</p>
        <div className="flex gap-2">
          <button onClick={onMoveUp} className="flex-1 px-2 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-background">
            ↑ 上移
          </button>
          <button onClick={onMoveDown} className="flex-1 px-2 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-background">
            ↓ 下移
          </button>
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-2">
        <button onClick={onDuplicate}
          className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text-secondary hover:bg-background hover:border-primary/30 transition-all">
          复制布块
        </button>
        <button onClick={onDelete}
          className="w-full px-3 py-2 rounded-xl bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-all">
          删除布块
        </button>
      </section>
    </div>
  )
}
