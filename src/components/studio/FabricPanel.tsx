import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FabricTexture } from '../../types'

interface Props {
  fabrics: FabricTexture[]
  selectedId: string | null
  onSelect: (fabric: FabricTexture) => void
  title?: string
}

export default function FabricPanel({ fabrics, selectedId, onSelect, title = '选择面料' }: Props) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = fabrics.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {title && <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2 px-0.5">{title}</p>}

      <div className="relative mb-2">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary/40 text-[10px]">🔍</span>
        <input
          type="text"
          placeholder="搜索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-6 pr-2 py-1 rounded-lg border border-border bg-card text-[11px] text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-[11px] text-text-secondary mb-1.5">还没有面料</p>
            <button onClick={() => navigate('/upload')} className="text-[11px] text-primary underline hover:no-underline">
              上传面料 →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filtered.map((fabric) => {
              const isSelected = selectedId === fabric.id
              return (
                <button
                  key={fabric.id}
                  onClick={() => onSelect(fabric)}
                  title={fabric.name}
                  className={`relative group flex flex-col items-center rounded-lg overflow-hidden border transition-all
                    ${isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/30'}`}
                >
                  <div
                    className="w-full aspect-square"
                    style={{
                      backgroundImage: `url(${fabric.processedImage})`,
                      backgroundRepeat: 'repeat',
                      backgroundSize: '48px 48px',
                    }}
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-[9px] shadow">
                      ✓
                    </div>
                  )}
                  <p className="w-full text-[9px] text-text-secondary bg-card px-1 py-0.5 truncate text-center leading-tight">
                    {fabric.name}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
