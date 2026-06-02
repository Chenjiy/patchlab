import { useState } from 'react'
import { getFabrics, getProjects } from '../services/storageService'
import { useToast } from '../context/ToastContext'

export default function SettingsPage() {
  const { showToast } = useToast()
  const [confirmClear, setConfirmClear] = useState<null | 'fabrics' | 'projects' | 'all'>(null)
  const fabricCount = getFabrics().length
  const projectCount = getProjects().length

  const clearLabelMap = { fabrics: '面料', projects: '设计', all: '所有数据' }

  const handleClear = () => {
    if (!confirmClear) return
    if (confirmClear === 'fabrics' || confirmClear === 'all') {
      localStorage.removeItem('patchlab_fabrics')
    }
    if (confirmClear === 'projects' || confirmClear === 'all') {
      localStorage.removeItem('patchlab_projects')
    }
    if (confirmClear === 'all') {
      localStorage.removeItem('patchlab_custom_shapes')
    }
    setConfirmClear(null)
    showToast('数据已清除', 'info')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="max-w-xl">
        <h1 className="text-2xl font-display font-bold text-text-primary mb-1">设置</h1>
        <p className="text-text-secondary text-sm mb-8">管理你的布样工坊数据</p>

        <section className="bg-card rounded-3xl border border-border p-6 shadow-soft mb-5">
          <h2 className="font-semibold text-text-primary mb-4">本地存储</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm text-text-primary">面料库</p>
                <p className="text-xs text-text-secondary">已保存 {fabricCount} 块面料</p>
              </div>
              <button onClick={() => setConfirmClear('fabrics')}
                className="text-xs text-primary/70 hover:text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                清除面料
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-text-primary">设计作品</p>
                <p className="text-xs text-text-secondary">已保存 {projectCount} 个设计</p>
              </div>
              <button onClick={() => setConfirmClear('projects')}
                className="text-xs text-primary/70 hover:text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                清除设计
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button onClick={() => setConfirmClear('all')}
              className="text-xs text-text-secondary/60 hover:text-primary transition-colors">
              清除所有数据
            </button>
          </div>
        </section>

        <section className="bg-card rounded-3xl border border-border p-6 shadow-soft">
          <h2 className="font-semibold text-text-primary mb-3">关于布样工坊</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            布样工坊是一款为缝纫、拼布和手工爱好者设计的数字面料设计工具。
            上传面料照片，排列布块，在裁剪前预览成品效果。
          </p>
          <p className="text-xs text-text-secondary/60">
            版本 0.1.0 · 所有数据存储在本地浏览器中
          </p>
        </section>
      </div>

      {confirmClear && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-3xl p-6 shadow-card max-w-sm mx-4 border border-border">
            <h3 className="font-semibold text-text-primary mb-2">清除{clearLabelMap[confirmClear]}？</h3>
            <p className="text-sm text-text-secondary mb-5">此操作无法撤销，所有数据将永久丢失。</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background">
                取消
              </button>
              <button onClick={handleClear}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark">
                清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
