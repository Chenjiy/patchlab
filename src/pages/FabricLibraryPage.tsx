import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FabricCard from '../components/fabric/FabricCard'
import FabricFilterBar from '../components/fabric/FabricFilterBar'
import { deleteFabric, getFabrics } from '../services/storageService'
import type { FabricTexture } from '../types'
import { useToast } from '../context/ToastContext'

export default function FabricLibraryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [fabrics, setFabrics] = useState<FabricTexture[]>([])
  const [search, setSearch] = useState('')
  const [material, setMaterial] = useState('')
  const [pattern, setPattern] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    setFabrics(getFabrics())
  }, [])

  const filtered = fabrics.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (material && f.material !== material) return false
    if (pattern && f.patternType !== pattern) return false
    if (colorFilter && !f.mainColors.includes(colorFilter)) return false
    return true
  })

  const confirmDeletion = async () => {
    if (!confirmDelete) return
    await deleteFabric(confirmDelete)
    setFabrics((prev) => prev.filter((f) => f.id !== confirmDelete))
    setConfirmDelete(null)
    showToast('面料已删除', 'info')
  }

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">我的面料</h1>
          <p className="text-text-secondary text-sm mt-1">共 {fabrics.length} 块面料</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-soft flex items-center gap-2"
        >
          <span>+</span> 添加面料
        </button>
      </div>

      <div className="mb-6">
        <FabricFilterBar
          search={search} onSearchChange={setSearch}
          material={material} onMaterialChange={setMaterial}
          pattern={pattern} onPatternChange={setPattern}
          colorFilter={colorFilter} onColorFilterChange={setColorFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-3xl bg-primary/8 flex items-center justify-center text-5xl mb-5">🧵</div>
          {fabrics.length === 0 ? (
            <>
              <h3 className="font-semibold text-text-primary mb-2">还没有面料</h3>
              <p className="text-sm text-text-secondary mb-5 max-w-xs">上传面料照片即可开始，只需片刻！</p>
              <button onClick={() => navigate('/upload')}
                className="px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:bg-primary-dark transition-colors">
                上传第一块面料
              </button>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-text-primary mb-2">没有符合条件的面料</h3>
              <p className="text-sm text-text-secondary">试试调整搜索词或筛选条件</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((fabric) => (
            <FabricCard
              key={fabric.id}
              fabric={fabric}
              onEdit={(id) => navigate(`/upload?fabric=${id}`)}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-3xl p-6 shadow-card max-w-sm mx-4 border border-border">
            <h3 className="font-semibold text-text-primary mb-2">删除这块面料？</h3>
            <p className="text-sm text-text-secondary mb-5">从面料库中删除后，已有设计中的布块不会受影响。</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background">
                取消
              </button>
              <button onClick={confirmDeletion}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark">
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
