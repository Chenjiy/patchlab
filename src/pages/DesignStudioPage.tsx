import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Konva from 'konva'
import type { Accessory, DesignProject, FabricTexture, MaskShape, PatchLayer, TemplateType } from '../types'
import { getFabrics, getProjectById, saveProject, cacheProject, saveCustomShape, getCustomShapes } from '../services/storageService'
import { generateId } from '../utils/id'
import { CANVAS_PADDING, CANVAS_TEMPLATES, PX_PER_CM } from '../data/templates'
import { getMaskById } from '../data/maskShapes'
import { captureCanvasPreview, exportCanvasAsPng } from '../services/exportService'
import { useToast } from '../context/ToastContext'
import DesignCanvas from '../components/studio/DesignCanvas'
import FabricPanel from '../components/studio/FabricPanel'
import MaskShapePanel from '../components/studio/MaskShapePanel'
import LayerPropertyPanel from '../components/studio/LayerPropertyPanel'
import AccessoryPanel from '../components/studio/AccessoryPanel'
import AccessoryPropertyPanel from '../components/studio/AccessoryPropertyPanel'
import TemplateSelector from '../components/studio/TemplateSelector'

type SideTab = 'fabric' | 'mask' | 'accessory'

function newProject(templateType: TemplateType, baseFabricId: string): DesignProject {
  const template = CANVAS_TEMPLATES.find((t) => t.id === templateType)!
  const defaultCm = Math.round(template.width / PX_PER_CM * 10) / 10
  const defaultHCm = Math.round(template.height / PX_PER_CM * 10) / 10
  return {
    id: generateId(),
    name: '新设计',
    templateType,
    baseFabricId,
    canvasWidth: template.width,
    canvasHeight: template.height,
    baseFabricScale: 1,
    baseFabricOffsetX: 0,
    baseFabricOffsetY: 0,
    customTopCm: defaultCm,
    customBottomCm: defaultCm,
    customHeightCm: defaultHCm,
    customCornerMm: 0,
    patchLayers: [],
    accessories: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default function DesignStudioPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const stageRef = useRef<Konva.Stage>(null)

  const fabrics = getFabrics()
  const [project, setProject] = useState<DesignProject | null>(null)
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([])
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null)
  const [sideTab, setSideTab] = useState<SideTab>('fabric')

  const historyRef = useRef<DesignProject[]>([])
  const futureRef = useRef<DesignProject[]>([])
  const keyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current?.(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const [pendingMaskId, setPendingMaskId] = useState<string | null>(null)
  const [pendingFabricId, setPendingFabricId] = useState<string | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const [drawMode, setDrawMode] = useState(false)
  const [drawnPoints, setDrawnPoints] = useState<number[]>([])
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null)
  const customShapeCountRef = useRef(0)
  const drawHistoryRef = useRef<number[][]>([])
  const drawFutureRef = useRef<number[][]>([])

  useEffect(() => {
    if (projectId) {
      const existing = getProjectById(projectId)
      if (existing) {
        const migrated: DesignProject = {
          ...existing,
          baseFabricScale: existing.baseFabricScale ?? 1,
          baseFabricOffsetX: existing.baseFabricOffsetX ?? 0,
          baseFabricOffsetY: existing.baseFabricOffsetY ?? 0,
          customTopCm: existing.customTopCm ?? Math.round(existing.canvasWidth / PX_PER_CM * 10) / 10,
          customBottomCm: existing.customBottomCm ?? Math.round(existing.canvasWidth / PX_PER_CM * 10) / 10,
          customHeightCm: existing.customHeightCm ?? Math.round(existing.canvasHeight / PX_PER_CM * 10) / 10,
          customCornerMm: existing.customCornerMm ?? 0,
          accessories: existing.accessories ?? [],
        }
        setProject(migrated)
        setNameValue(existing.name)
        return
      }
    }
    if (fabrics.length === 0) return
    const p = newProject('phone-pouch', fabrics[0].id)
    setProject(p)
    setNameValue(p.name)
  }, [])

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/8 flex items-center justify-center text-5xl mb-5">✂️</div>
        <h2 className="font-semibold text-text-primary text-lg mb-2">还没有面料</h2>
        <p className="text-text-secondary text-sm mb-5 max-w-xs">请先上传至少一块面料，再开始设计。</p>
        <button onClick={() => navigate('/upload')} className="px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:bg-primary-dark transition-colors">
          上传面料 →
        </button>
      </div>
    )
  }

  const selectedLayer = selectedLayerIds.length === 1
    ? project.patchLayers.find((l) => l.id === selectedLayerIds[0]) ?? null
    : null
  const selectedAccessory = project.accessories.find((a) => a.id === selectedAccessoryId) ?? null

  const updateProject = (updates: Partial<DesignProject>) => {
    if (project) {
      historyRef.current = [...historyRef.current.slice(-49), project]
      futureRef.current = []
    }
    setProject((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() }
      cacheProject(next)
      return next
    })
  }

  const handleTemplateChange = (type: TemplateType) => {
    if (type === 'custom') {
      // Don't reset custom params when switching to custom — the editor handles that
      updateProject({ templateType: type })
      return
    }
    const t = CANVAS_TEMPLATES.find((t) => t.id === type)!
    const topCm = Math.round(t.width / PX_PER_CM * 10) / 10
    const hCm = Math.round(t.height / PX_PER_CM * 10) / 10
    updateProject({
      templateType: type,
      canvasWidth: t.width,
      canvasHeight: t.height,
      customTopCm: topCm,
      customBottomCm: topCm,
      customHeightCm: hCm,
      customCornerMm: 0,
    })
  }

  const handleCanvasSizeChange = (w: number, h: number) => {
    updateProject({ canvasWidth: w, canvasHeight: h })
  }

  const handleCustomParamsChange = (params: { topCm: number; bottomCm: number; heightCm: number; cornerMm: number }) => {
    updateProject({
      customTopCm: params.topCm,
      customBottomCm: params.bottomCm,
      customHeightCm: params.heightCm,
      customCornerMm: params.cornerMm,
    })
  }

  const handleBaseFabricSelect = (fabric: FabricTexture) => {
    updateProject({ baseFabricId: fabric.id })
  }

  const handleAddPatch = () => {
    if (!pendingMaskId || !pendingFabricId) {
      showToast('请先选择蒙版形状和面料', 'info')
      return
    }
    const mask = getMaskById(pendingMaskId)
    if (!mask) return
    const newLayer: PatchLayer = {
      id: generateId(),
      maskShapeId: pendingMaskId,
      fabricTextureId: pendingFabricId,
      x: Math.round((project.canvasWidth - mask.defaultWidth) / 2),
      y: Math.round((project.canvasHeight - mask.defaultHeight) / 2),
      width: mask.defaultWidth,
      height: mask.defaultHeight,
      rotation: 0,
      textureScale: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      textureRotation: 0,
      edgeStyle: 'topstitch',
      zIndex: project.patchLayers.length,
    }
    updateProject({ patchLayers: [...project.patchLayers, newLayer] })
    setSelectedLayerIds([newLayer.id])
    setSelectedAccessoryId(null)
    showToast('布块已添加！拖动来调整位置。', 'success')
  }

  const handleUpdateLayer = (id: string, updates: Partial<PatchLayer>) => {
    const isDragOnly = 'x' in updates && 'y' in updates && !('width' in updates) && !('height' in updates) && !('rotation' in updates)
    if (isDragOnly && selectedLayerIds.length > 1 && selectedLayerIds.includes(id)) {
      const source = project.patchLayers.find((l) => l.id === id)
      if (source) {
        const dX = (updates.x ?? source.x) - source.x
        const dY = (updates.y ?? source.y) - source.y
        updateProject({
          patchLayers: project.patchLayers.map((l) =>
            selectedLayerIds.includes(l.id) ? { ...l, x: l.x + dX, y: l.y + dY } : l
          ),
        })
        return
      }
    }
    updateProject({
      patchLayers: project.patchLayers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })
  }

  const handleTransformLayersEnd = (changes: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>) => {
    if (changes.length === 0) return
    updateProject({
      patchLayers: project.patchLayers.map((l) => {
        const c = changes.find((ch) => ch.id === l.id)
        if (!c) return l
        return { ...l, x: c.x, y: c.y, width: c.width, height: c.height, rotation: c.rotation }
      }),
    })
  }

  const handleDeleteLayer = () => {
    if (selectedLayerIds.length === 0) return
    updateProject({ patchLayers: project.patchLayers.filter((l) => !selectedLayerIds.includes(l.id)) })
    setSelectedLayerIds([])
  }

  const handleDuplicateLayer = () => {
    if (selectedLayerIds.length === 0) return
    const toAdd: PatchLayer[] = []
    const newIds: string[] = []
    let zBase = project.patchLayers.length
    for (const id of selectedLayerIds) {
      const src = project.patchLayers.find((l) => l.id === id)
      if (!src) continue
      const dup: PatchLayer = { ...src, id: generateId(), x: src.x + 20, y: src.y + 20, zIndex: zBase++ }
      toAdd.push(dup)
      newIds.push(dup.id)
    }
    updateProject({ patchLayers: [...project.patchLayers, ...toAdd] })
    setSelectedLayerIds(newIds)
  }

  const handleMoveLayerUp = () => {
    if (!selectedLayer) return
    updateProject({
      patchLayers: project.patchLayers.map((l) =>
        l.id === selectedLayer.id ? { ...l, zIndex: l.zIndex + 1 }
          : l.zIndex === selectedLayer.zIndex + 1 ? { ...l, zIndex: l.zIndex - 1 }
          : l
      ),
    })
  }

  const handleMoveLayerDown = () => {
    if (!selectedLayer) return
    updateProject({
      patchLayers: project.patchLayers.map((l) =>
        l.id === selectedLayer.id ? { ...l, zIndex: Math.max(0, l.zIndex - 1) }
          : l.zIndex === selectedLayer.zIndex - 1 ? { ...l, zIndex: l.zIndex + 1 }
          : l
      ),
    })
  }

  // --- Accessory handlers ---

  const handleAddAccessory = (acc: Accessory) => {
    updateProject({ accessories: [...project.accessories, acc] })
    setSelectedAccessoryId(acc.id)
    setSelectedLayerIds([])
    showToast('配件已添加！', 'success')
  }

  const handleUpdateAccessory = (id: string, updates: Partial<Accessory>) => {
    updateProject({
      accessories: project.accessories.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })
  }

  const getAccCategory = (type: Accessory['type']) =>
    type === 'loop-tab' ? 'seam' : (type === 'strap' || type === 'handle') ? 'overlay' : 'surface'

  const handleMoveAccessoryUp = () => {
    if (!selectedAccessoryId) return
    const acc = project.accessories.find(a => a.id === selectedAccessoryId)
    if (!acc) return
    const peers = project.accessories
      .filter(a => getAccCategory(a.type) === getAccCategory(acc.type))
      .sort((a, b) => a.zIndex - b.zIndex)
    const idx = peers.findIndex(a => a.id === acc.id)
    if (idx >= peers.length - 1) return
    const other = peers[idx + 1]
    updateProject({
      accessories: project.accessories.map(a =>
        a.id === acc.id ? { ...a, zIndex: other.zIndex }
        : a.id === other.id ? { ...a, zIndex: acc.zIndex }
        : a
      ),
    })
  }

  const handleMoveAccessoryDown = () => {
    if (!selectedAccessoryId) return
    const acc = project.accessories.find(a => a.id === selectedAccessoryId)
    if (!acc) return
    const peers = project.accessories
      .filter(a => getAccCategory(a.type) === getAccCategory(acc.type))
      .sort((a, b) => a.zIndex - b.zIndex)
    const idx = peers.findIndex(a => a.id === acc.id)
    if (idx <= 0) return
    const other = peers[idx - 1]
    updateProject({
      accessories: project.accessories.map(a =>
        a.id === acc.id ? { ...a, zIndex: other.zIndex }
        : a.id === other.id ? { ...a, zIndex: acc.zIndex }
        : a
      ),
    })
  }

  const handleDeleteAccessory = () => {
    if (!selectedAccessoryId) return
    updateProject({ accessories: project.accessories.filter((a) => a.id !== selectedAccessoryId) })
    setSelectedAccessoryId(null)
  }

  const handleSelectLayer = (id: string | null, addToSelection = false) => {
    if (id === null) {
      setSelectedLayerIds([])
    } else if (addToSelection) {
      setSelectedLayerIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    } else {
      setSelectedLayerIds([id])
    }
    if (id !== null) setSelectedAccessoryId(null)
  }

  const handleSelectAccessory = (id: string | null) => {
    setSelectedAccessoryId(id)
    if (id !== null) setSelectedLayerIds([])
  }

  // --- Save / Export ---

  const canvasCrop = {
    x: CANVAS_PADDING, y: CANVAS_PADDING,
    width: project.canvasWidth, height: project.canvasHeight,
  }

  const handleSave = async () => {
    const preview = await captureCanvasPreview(stageRef, canvasCrop)
    const toSave = { ...project, previewImage: preview, updatedAt: new Date().toISOString() }
    await saveProject(toSave)
    setProject(toSave)
    showToast('设计已保存！', 'success')
  }

  const handleExport = () => exportCanvasAsPng(stageRef, `${project.name}.png`)

  const handleNameSave = () => {
    if (nameValue.trim()) updateProject({ name: nameValue.trim() })
    setEditingName(false)
  }

  // --- Free draw ---
  const handleStartDraw = () => {
    setDrawMode(true)
    setDrawnPoints([])
    setEditingShapeId(null)
    drawHistoryRef.current = []
    drawFutureRef.current = []
    setSelectedLayerIds([])
    setSelectedAccessoryId(null)
    setSideTab('mask')
  }

  const handleCancelDraw = () => {
    setDrawMode(false)
    setDrawnPoints([])
    setEditingShapeId(null)
    drawHistoryRef.current = []
    drawFutureRef.current = []
  }

  const handleAddDrawPoint = (x: number, y: number) => {
    setDrawnPoints((prev) => {
      drawHistoryRef.current = [...drawHistoryRef.current.slice(-49), [...prev]]
      drawFutureRef.current = []
      return [...prev, x, y]
    })
  }

  const handleMoveDrawPoint = (index: number, x: number, y: number) => {
    setDrawnPoints((prev) => {
      drawHistoryRef.current = [...drawHistoryRef.current.slice(-49), [...prev]]
      drawFutureRef.current = []
      const next = [...prev]
      next[index * 2] = x
      next[index * 2 + 1] = y
      return next
    })
  }

  const handleStartEditShape = (shape: MaskShape) => {
    if (!shape.rawPoints || shape.rawPoints.length < 6) {
      showToast('该形状暂不支持编辑', 'info')
      return
    }
    const offX = Math.round((project!.canvasWidth - shape.defaultWidth) / 2)
    const offY = Math.round((project!.canvasHeight - shape.defaultHeight) / 2)
    const pts: number[] = []
    for (let i = 0; i < shape.rawPoints.length; i += 2) {
      pts.push(shape.rawPoints[i] + offX, shape.rawPoints[i + 1] + offY)
    }
    setEditingShapeId(shape.id)
    setDrawnPoints(pts)
    drawHistoryRef.current = []
    drawFutureRef.current = []
    setDrawMode(true)
    setSelectedLayerIds([])
    setSelectedAccessoryId(null)
    setSideTab('mask')
  }

  const handleFinalizeDrawn = async () => {
    if (drawnPoints.length < 6) return

    const xs = drawnPoints.filter((_, i) => i % 2 === 0)
    const ys = drawnPoints.filter((_, i) => i % 2 === 1)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    const svgParts: string[] = []
    const rawPoints: number[] = []
    for (let i = 0; i < drawnPoints.length; i += 2) {
      const nx = drawnPoints[i] - minX
      const ny = drawnPoints[i + 1] - minY
      svgParts.push(i === 0 ? `M ${nx} ${ny}` : `L ${nx} ${ny}`)
      rawPoints.push(nx, ny)
    }
    const svgPath = svgParts.join(' ') + ' Z'

    const isEditing = !!editingShapeId
    const existingName = isEditing
      ? getCustomShapes().find((s) => s.id === editingShapeId)?.name
      : undefined

    if (!isEditing) customShapeCountRef.current += 1

    const shape: MaskShape = {
      id: isEditing ? editingShapeId! : generateId(),
      name: existingName ?? `自定义 ${customShapeCountRef.current}`,
      category: 'custom',
      type: 'custom',
      svgPath,
      rawPoints,
      defaultWidth: Math.max(maxX - minX, 20),
      defaultHeight: Math.max(maxY - minY, 20),
    }

    await saveCustomShape(shape)
    setPendingMaskId(shape.id)
    setDrawMode(false)
    setDrawnPoints([])
    setEditingShapeId(null)
    drawHistoryRef.current = []
    drawFutureRef.current = []
    showToast(isEditing ? '形状已更新！' : '自定义形状已保存！选择面料后点击"添加布块"。', 'success')
  }

  keyHandlerRef.current = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable

    // Draw mode: intercept undo/redo for point history only
    if (drawMode) {
      const isUndo = (e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey
      const isRedo = (((e.key === 'z' || e.key === 'Z') && e.shiftKey) || (e.key === 'y' || e.key === 'Y')) && (e.ctrlKey || e.metaKey)
      if (isUndo || isRedo) {
        e.preventDefault()
        if (isUndo) {
          const prev = drawHistoryRef.current[drawHistoryRef.current.length - 1]
          if (prev) {
            drawFutureRef.current = [...drawFutureRef.current.slice(-49), [...drawnPoints]]
            drawHistoryRef.current = drawHistoryRef.current.slice(0, -1)
            setDrawnPoints(prev)
          }
        } else {
          const next = drawFutureRef.current[drawFutureRef.current.length - 1]
          if (next) {
            drawHistoryRef.current = [...drawHistoryRef.current.slice(-49), [...drawnPoints]]
            drawFutureRef.current = drawFutureRef.current.slice(0, -1)
            setDrawnPoints(next)
          }
        }
        return
      }
      if (e.key === 'Escape') { e.preventDefault(); handleCancelDraw() }
      return
    }

    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      const prev = historyRef.current[historyRef.current.length - 1]
      if (prev) {
        setProject((cur) => {
          if (cur) futureRef.current = [...futureRef.current.slice(-49), cur]
          cacheProject(prev)
          return prev
        })
        historyRef.current = historyRef.current.slice(0, -1)
      }
      return
    }
    if (((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey))) {
      e.preventDefault()
      const next = futureRef.current[futureRef.current.length - 1]
      if (next) {
        setProject((cur) => {
          if (cur) historyRef.current = [...historyRef.current.slice(-49), cur]
          cacheProject(next)
          return next
        })
        futureRef.current = futureRef.current.slice(0, -1)
      }
      return
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
      e.preventDefault()
      if (selectedLayerIds.length > 0) handleDeleteLayer()
      else if (selectedAccessoryId) handleDeleteAccessory()
    }
  }

  const baseFabric = fabrics.find((f) => f.id === project.baseFabricId)

  const SIDE_TABS = [
    ['fabric', '🧵', '面料'],
    ['mask', '✂️', '形状'],
    ['accessory', '🔗', '配件'],
  ] as const

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-5 py-3 bg-card border-b border-border flex-shrink-0 overflow-x-auto">
        <button onClick={() => navigate('/')} className="text-text-secondary hover:text-primary text-sm flex-shrink-0">← 返回</button>
        <div className="w-px h-4 bg-border flex-shrink-0" />

        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            className="text-sm font-semibold text-text-primary bg-background border border-primary/30 rounded-lg px-2 py-1 focus:outline-none flex-shrink-0"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-semibold text-text-primary hover:text-primary flex items-center gap-1 flex-shrink-0"
          >
            {project.name} <span className="text-text-secondary/50 text-xs">✎</span>
          </button>
        )}

        <div className="flex-1 min-w-4" />

        <TemplateSelector
          selected={project.templateType}
          canvasWidth={project.canvasWidth}
          canvasHeight={project.canvasHeight}
          customParams={project.templateType === 'custom' ? {
            topCm: project.customTopCm ?? project.canvasWidth / PX_PER_CM,
            bottomCm: project.customBottomCm ?? project.canvasWidth / PX_PER_CM,
            heightCm: project.customHeightCm ?? project.canvasHeight / PX_PER_CM,
            cornerMm: project.customCornerMm ?? 0,
          } : undefined}
          onSelect={handleTemplateChange}
          onSizeChange={handleCanvasSizeChange}
          onCustomParamsChange={handleCustomParamsChange}
        />

        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleExport} className="px-3 py-2 rounded-xl border border-border text-xs text-text-secondary hover:bg-background transition-colors">
            导出 PNG
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors shadow-soft">
            保存
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0">
          <div className="flex border-b border-border">
            {SIDE_TABS.map(([tab, icon, label]) => (
              <button
                key={tab}
                onClick={() => setSideTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors
                  ${sideTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sideTab === 'fabric' && (
              <FabricPanel
                fabrics={fabrics}
                selectedId={pendingFabricId}
                onSelect={(f) => setPendingFabricId(f.id)}
                title="贴片面料"
              />
            )}
            {sideTab === 'mask' && (
              <MaskShapePanel
                selectedId={pendingMaskId}
                onSelect={(s: MaskShape) => setPendingMaskId(s.id)}
                drawMode={drawMode}
                editingShape={!!editingShapeId}
                onStartDraw={handleStartDraw}
                onCancelDraw={handleCancelDraw}
                onEditShape={handleStartEditShape}
              />
            )}
            {sideTab === 'accessory' && (
              <AccessoryPanel
                canvasWidth={project.canvasWidth}
                canvasHeight={project.canvasHeight}
                accessoryCount={project.accessories.length}
                onAdd={handleAddAccessory}
              />
            )}
          </div>

          {/* Add patch button — only shown on fabric/mask tabs */}
          {sideTab !== 'accessory' && (
            <div className="p-3 border-t border-border space-y-2">
              <div className="text-[10px] text-text-secondary space-y-0.5 px-1">
                {pendingFabricId ? (
                  <p className="text-primary">✓ {fabrics.find(f => f.id === pendingFabricId)?.name}</p>
                ) : (
                  <p>1. 选择面料</p>
                )}
                {pendingMaskId ? (
                  <p className="text-primary">✓ {getMaskById(pendingMaskId)?.name ?? '自定义形状'}</p>
                ) : (
                  <p>2. 选择形状</p>
                )}
              </div>
              <button
                onClick={handleAddPatch}
                disabled={!pendingMaskId || !pendingFabricId || drawMode}
                className="w-full py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + 添加布块
              </button>
            </div>
          )}

          {/* Base fabric selector */}
          <div className="p-3 border-t border-border flex flex-col" style={{ maxHeight: 160 }}>
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2 flex-shrink-0">底布</p>
            <div className="flex-1 overflow-y-auto">
              <FabricPanel
                fabrics={fabrics}
                selectedId={project.baseFabricId}
                onSelect={handleBaseFabricSelect}
                title=""
              />
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-3">
          <div className="flex-1 overflow-hidden min-h-0">
          <DesignCanvas
            project={project}
            selectedLayerIds={selectedLayerIds}
            onSelectLayer={handleSelectLayer}
            onUpdateLayer={handleUpdateLayer}
            onTransformLayersEnd={handleTransformLayersEnd}
            selectedAccessoryId={selectedAccessoryId}
            onSelectAccessory={handleSelectAccessory}
            onUpdateAccessory={handleUpdateAccessory}
            stageRef={stageRef as React.RefObject<Konva.Stage | null>}
            drawMode={drawMode}
            drawnPoints={drawnPoints}
            onAddDrawPoint={handleAddDrawPoint}
            onMoveDrawPoint={handleMoveDrawPoint}
            onFinalizeDrawn={handleFinalizeDrawn}
          />
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-text-secondary flex-shrink-0">
            <span>{project.canvasWidth} × {project.canvasHeight}px</span>
            <span>·</span>
            <span>{project.patchLayers.length} 个布块</span>
            {project.accessories.length > 0 && (
              <>
                <span>·</span>
                <span>{project.accessories.length} 个配件</span>
              </>
            )}
            <span>·</span>
            <span>底布：{baseFabric?.name ?? '无'}</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-56 bg-card border-l border-border flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-text-primary">属性</p>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedAccessory ? (
              <AccessoryPropertyPanel
                accessory={selectedAccessory}
                fabrics={fabrics}
                onUpdate={(updates) => handleUpdateAccessory(selectedAccessoryId!, updates)}
                onDelete={handleDeleteAccessory}
                onMoveUp={handleMoveAccessoryUp}
                onMoveDown={handleMoveAccessoryDown}
              />
            ) : (
              <LayerPropertyPanel
                layer={selectedLayer}
                selectedCount={selectedLayerIds.length}
                fabrics={fabrics}
                onUpdate={(updates) => selectedLayer && handleUpdateLayer(selectedLayer.id, updates)}
                onDelete={handleDeleteLayer}
                onDuplicate={handleDuplicateLayer}
                onMoveUp={handleMoveLayerUp}
                onMoveDown={handleMoveLayerDown}
                baseFabric={{
                  scale: project.baseFabricScale ?? 1,
                  offsetX: project.baseFabricOffsetX ?? 0,
                  offsetY: project.baseFabricOffsetY ?? 0,
                  saturation: project.baseFabricSaturation ?? 0,
                  brightness: project.baseFabricBrightness ?? 0,
                  onUpdate: (u) => updateProject({
                    ...(u.scale !== undefined && { baseFabricScale: u.scale }),
                    ...(u.offsetX !== undefined && { baseFabricOffsetX: u.offsetX }),
                    ...(u.offsetY !== undefined && { baseFabricOffsetY: u.offsetY }),
                    ...(u.saturation !== undefined && { baseFabricSaturation: u.saturation }),
                    ...(u.brightness !== undefined && { baseFabricBrightness: u.brightness }),
                  }),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
