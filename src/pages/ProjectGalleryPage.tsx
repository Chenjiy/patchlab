import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DesignProject } from '../types'
import { deleteProject, duplicateProject, getProjects } from '../services/storageService'
import { downloadDataUrl } from '../services/exportService'
import { useToast } from '../context/ToastContext'
import { CANVAS_TEMPLATES } from '../data/templates'

export default function ProjectGalleryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [projects, setProjects] = useState<DesignProject[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    setProjects(getProjects())
  }, [])

  const confirmDeletion = async () => {
    if (!confirmDelete) return
    await deleteProject(confirmDelete)
    setProjects((prev) => prev.filter((p) => p.id !== confirmDelete))
    setConfirmDelete(null)
    showToast('设计已删除', 'info')
  }

  const handleExport = (project: DesignProject) => {
    if (!project.previewImage) { showToast('暂无预览图，请先打开并保存该设计', 'info'); return }
    downloadDataUrl(project.previewImage, `${project.name}.png`)
    showToast('正在导出…', 'info')
  }

  const handleDuplicate = async (id: string) => {
    setDuplicating(id)
    try {
      const copy = await duplicateProject(id)
      setProjects((prev) => [copy, ...prev])
      showToast(`已创建副本"${copy.name}"`, 'success')
    } catch {
      showToast('创建副本失败，请重试', 'error')
    } finally {
      setDuplicating(null)
    }
  }

  const getTemplateName = (type: string) => CANVAS_TEMPLATES.find((t) => t.id === type)?.name ?? type

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">我的作品</h1>
          <p className="text-text-secondary text-sm mt-1">共 {projects.length} 个设计</p>
        </div>
        <button
          onClick={() => navigate('/studio')}
          className="px-4 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-soft flex items-center gap-2"
        >
          <span>+</span> 新建设计
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-3xl bg-secondary/20 flex items-center justify-center text-5xl mb-5">🗂️</div>
          <h3 className="font-semibold text-text-primary mb-2">还没有作品</h3>
          <p className="text-sm text-text-secondary mb-5 max-w-xs">去设计工坊创建第一个拼布设计吧。</p>
          <button onClick={() => navigate('/studio')}
            className="px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:bg-primary-dark transition-colors">
            打开设计工坊
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              templateName={getTemplateName(project.templateType)}
              onOpen={() => navigate(`/studio?project=${project.id}`)}
              onDelete={() => setConfirmDelete(project.id)}
              onExport={() => handleExport(project)}
              onDuplicate={() => handleDuplicate(project.id)}
              duplicating={duplicating === project.id}
            />
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-3xl p-6 shadow-card max-w-sm mx-4 border border-border">
            <h3 className="font-semibold text-text-primary mb-2">删除这个设计？</h3>
            <p className="text-sm text-text-secondary mb-5">此操作无法撤销。</p>
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

function ProjectCard({ project, templateName, onOpen, onDelete, onExport, onDuplicate, duplicating }: {
  project: DesignProject
  templateName: string
  onOpen: () => void
  onDelete: () => void
  onExport: () => void
  onDuplicate: () => void
  duplicating: boolean
}) {
  const updatedDate = new Date(project.updatedAt).toLocaleDateString('zh-CN', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="bg-card rounded-3xl border border-border shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden group">
      <div
        className="w-full aspect-[4/3] bg-canvas cursor-pointer flex items-center justify-center overflow-hidden"
        onClick={onOpen}
      >
        {project.previewImage ? (
          <img src={project.previewImage} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-secondary/40">
            <span className="text-4xl">✂️</span>
            <span className="text-xs">暂无预览</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-text-primary text-sm mb-1 truncate">{project.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/30 text-text-secondary">
            {templateName}
          </span>
          <span className="text-[10px] text-text-secondary/60">
            {project.patchLayers.length} 个布块
          </span>
        </div>
        <p className="text-[11px] text-text-secondary/60 mb-3">{updatedDate}</p>

        <div className="flex gap-1">
          <button onClick={onOpen}
            className="flex-1 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
            编辑
          </button>
          <button onClick={onDuplicate} disabled={duplicating} title="创建副本"
            className="px-2.5 py-1.5 rounded-xl border border-border text-xs text-text-secondary hover:bg-background transition-colors disabled:opacity-40">
            {duplicating ? '…' : '⧉'}
          </button>
          <button onClick={onExport}
            className="px-2.5 py-1.5 rounded-xl border border-border text-xs text-text-secondary hover:bg-background transition-colors">
            ↓
          </button>
          <button onClick={onDelete}
            className="px-2.5 py-1.5 rounded-xl border border-border text-xs text-text-secondary hover:border-primary/30 hover:text-primary transition-colors">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
