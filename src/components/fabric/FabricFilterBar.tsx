import { MATERIAL_LABELS, PATTERN_LABELS, PRESET_COLORS } from '../../utils/colors'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  material: string
  onMaterialChange: (v: string) => void
  pattern: string
  onPatternChange: (v: string) => void
  colorFilter: string
  onColorFilterChange: (v: string) => void
}

export default function FabricFilterBar({
  search, onSearchChange,
  material, onMaterialChange,
  pattern, onPatternChange,
  colorFilter, onColorFilterChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50 text-sm">🔍</span>
        <input
          type="text"
          placeholder="搜索面料…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 w-48"
        />
      </div>

      {/* Material */}
      <select
        value={material}
        onChange={(e) => onMaterialChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-text-primary focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
      >
        <option value="">全部材质</option>
        {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Pattern */}
      <select
        value={pattern}
        onChange={(e) => onPatternChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-text-primary focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
      >
        <option value="">全部花型</option>
        {Object.entries(PATTERN_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Color dots */}
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => onColorFilterChange('')}
          className={`w-6 h-6 rounded-full border-2 transition-all ${colorFilter === '' ? 'border-primary shadow-sm scale-110' : 'border-border'} bg-background`}
          title="All colors"
        />
        {PRESET_COLORS.slice(0, 10).map((c) => (
          <button
            key={c.value}
            onClick={() => onColorFilterChange(colorFilter === c.value ? '' : c.value)}
            className={`w-5 h-5 rounded-full border-2 transition-all ${colorFilter === c.value ? 'border-primary shadow-sm scale-110' : 'border-white shadow-sm'}`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  )
}
