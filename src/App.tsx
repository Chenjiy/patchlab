import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import FabricLibraryPage from './pages/FabricLibraryPage'
import UploadFabricPage from './pages/UploadFabricPage'
import DesignStudioPage from './pages/DesignStudioPage'
import ProjectGalleryPage from './pages/ProjectGalleryPage'
import SettingsPage from './pages/SettingsPage'
import { initializeStore } from './services/storageService'

export default function App() {
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    initializeStore()
      .then(() => setReady(true))
      .catch((e: unknown) => setInitError(e instanceof Error ? e.message : '无法连接到云服务'))
  }, [])

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-sm">
          <p className="text-lg font-semibold text-text-primary mb-2">连接失败</p>
          <p className="text-sm text-text-secondary break-all">{initError}</p>
          <p className="text-xs text-text-secondary/60 mt-3">请检查 .env.local 中的 Supabase 配置</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">加载中…</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Full-screen studio (no sidebar) */}
          <Route path="/studio" element={<DesignStudioPage />} />

          {/* Pages with sidebar layout */}
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/fabrics" element={<FabricLibraryPage />} />
            <Route path="/upload" element={<UploadFabricPage />} />
            <Route path="/gallery" element={<ProjectGalleryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
