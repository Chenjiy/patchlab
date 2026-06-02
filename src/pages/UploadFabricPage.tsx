import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { processFabricImage } from '../services/imageProcessingService'
import { saveFabric, getFabricById } from '../services/storageService'
import { processImage } from '../utils/imageProcessing'
import type { FabricTexture, MaterialLabel, PatternLabel } from '../types'
import { generateId } from '../utils/id'
import { MATERIAL_LABELS, PATTERN_LABELS, PRESET_COLORS } from '../utils/colors'
import { useToast } from '../context/ToastContext'
import CropTool from '../components/fabric/CropTool'

type Step = 'upload' | 'process' | 'details'

export default function UploadFabricPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editingId = searchParams.get('fabric')

  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [originalUrl, setOriginalUrl] = useState('')
  // baseProcessedUrl = raw 512x512 crop (no adjustments); processedUrl = final (with sat/bri)
  const [baseProcessedUrl, setBaseProcessedUrl] = useState('')
  const [processedUrl, setProcessedUrl] = useState('')
  const [tileSize, setTileSize] = useState(96)
  const [saturation, setSaturation] = useState(0)
  const [brightness, setBrightness] = useState(0)
  const [editingCreatedAt, setEditingCreatedAt] = useState('')

  const [name, setName] = useState('')
  const [material, setMaterial] = useState<MaterialLabel>('cotton')
  const [patternType, setPatternType] = useState<PatternLabel>('floral')
  const [mainColors, setMainColors] = useState<string[]>([])
  const [sizeNote, setSizeNote] = useState('')
  const [useCases, setUseCases] = useState<string[]>([])
  const [tags, setTags] = useState('')

  const USE_CASE_OPTIONS = ['手机袋', '电脑包', '杯垫', '帆布袋', '发绳', '贴布绣', '口袋', '胸章']

  const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

  // Recompute processedUrl whenever base image or adjustments change
  useEffect(() => {
    if (!baseProcessedUrl) return
    if (saturation === 0 && brightness === 0) {
      setProcessedUrl(baseProcessedUrl)
      return
    }
    const img = new Image()
    img.src = baseProcessedUrl
    img.onload = () => {
      const result = processImage(img, saturation, brightness)
      setProcessedUrl(
        result instanceof HTMLCanvasElement
          ? result.toDataURL('image/png')
          : baseProcessedUrl
      )
    }
  }, [baseProcessedUrl, saturation, brightness])

  useEffect(() => {
    if (!editingId) return
    const fabric = getFabricById(editingId)
    if (!fabric) return
    setName(fabric.name)
    setMaterial(fabric.material)
    setPatternType(fabric.patternType)
    setMainColors(fabric.mainColors)
    setSizeNote(fabric.sizeNote)
    setUseCases(fabric.useCases)
    setTags(fabric.tags.join(', '))
    setOriginalUrl(fabric.originalImage)
    setBaseProcessedUrl(fabric.processedImage)
    setEditingCreatedAt(fabric.createdAt)
    setStep('details')
  }, [editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileDrop = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_FILE_BYTES) {
      showToast('图片超过 20 MB，请压缩后再上传', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await processFabricImage(file)
      setOriginalUrl(result.processedDataUrl)
      setBaseProcessedUrl('')
      setProcessedUrl('')
      setStep('process')
    } catch {
      showToast('图片处理失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileDrop(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileDrop(file)
  }

  const toggleColor = (color: string) => {
    setMainColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color].slice(0, 5)
    )
  }

  const toggleUseCase = (uc: string) => {
    setUseCases((prev) =>
      prev.includes(uc) ? prev.filter((u) => u !== uc) : [...prev, uc]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) { showToast('请输入面料名称', 'error'); return }
    setLoading(true)
    const fabric: FabricTexture = {
      id: editingId ?? generateId(),
      name: name.trim(),
      originalImage: originalUrl,
      processedImage: processedUrl || baseProcessedUrl,
      material,
      patternType,
      mainColors,
      sizeNote,
      useCases,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: editingCreatedAt || new Date().toISOString(),
    }
    try {
      await saveFabric(fabric)
      showToast(editingId ? `"${name}" 已更新！` : `"${name}" 已保存到面料库！`)
      navigate('/fabrics')
    } catch (e) {
      console.error('saveFabric error:', e)
      showToast('保存失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-text-secondary text-sm mb-4 hover:text-primary flex items-center gap-1">
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: '"ZCOOL KuaiLe", serif' }}>
            {editingId ? '编辑面料' : '上传面料'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {editingId ? '修改面料信息和裁剪图片' : '将新面料添加到你的数字面料库'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {(['upload', 'process', 'details'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                ${step === s ? 'bg-primary text-white' : i < ['upload', 'process', 'details'].indexOf(step) ? 'bg-secondary text-white' : 'bg-border text-text-secondary'}`}>
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-primary' : 'text-text-secondary'}`}>
                {s === 'upload' ? '上传' : s === 'process' ? '裁剪' : '详情'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/3 transition-all"
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            {loading ? (
              <div className="text-center">
                <div className="text-4xl mb-4 animate-spin">✿</div>
                <p className="text-text-secondary text-sm">正在处理面料图片…</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-5 mx-auto">📷</div>
                <p className="font-semibold text-text-primary mb-2">拖放面料照片到这里</p>
                <p className="text-sm text-text-secondary mb-4">或点击选择文件</p>
                <p className="text-xs text-text-secondary/60">JPG、PNG、WEBP — 最大 20 MB</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Crop */}
        {step === 'process' && (
          <div className="flex gap-8 items-start flex-wrap">
            <div className="flex-shrink-0">
              <p className="text-sm font-medium text-text-primary mb-3">调整裁剪区域</p>
              <p className="text-xs text-text-secondary mb-4">拖动重新定位 · 滚轮或拖动滑块缩放</p>
              <CropTool
                imageUrl={originalUrl}
                displaySize={380}
                outputSize={512}
                onCrop={(dataUrl) => {
                  setBaseProcessedUrl(dataUrl)
                  setSaturation(0)
                  setBrightness(0)
                  setStep('details')
                }}
              />
              <button
                onClick={() => setStep('upload')}
                className="mt-3 text-xs text-text-secondary hover:text-primary transition-colors"
              >
                ← 重新上传其他照片
              </button>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-medium text-text-secondary mb-3">原始照片</p>
              <div className="rounded-2xl overflow-hidden border border-border bg-canvas">
                <img src={originalUrl} className="w-full object-contain max-h-96" alt="原始照片" style={{ display: 'block' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: preview */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-soft space-y-3">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={processedUrl || baseProcessedUrl} className="w-full h-full object-cover" alt="裁剪后的面料" />
                </div>
                <div>
                  <p className="text-[11px] text-text-secondary mb-1.5">拼贴效果预览</p>
                  <div
                    className="w-full rounded-xl"
                    style={{
                      height: 72,
                      backgroundImage: `url(${processedUrl || baseProcessedUrl})`,
                      backgroundRepeat: 'repeat',
                      backgroundSize: `${tileSize}px ${tileSize}px`,
                    }}
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-text-secondary shrink-0">图块大小</span>
                    <input type="range" min={32} max={200} value={tileSize}
                      onChange={(e) => setTileSize(Number(e.target.value))}
                      className="flex-1 accent-primary" />
                    <span className="text-[11px] text-text-secondary w-10">{tileSize}px</span>
                  </div>
                </div>

                {/* Sat / brightness adjustment */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">色调调整</p>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[11px] text-text-secondary">饱和度</label>
                      <span className="text-[11px] text-text-secondary">{(saturation >= 0 ? '+' : '') + saturation.toFixed(2)}</span>
                    </div>
                    <input type="range" min={-1} max={2} step={0.05}
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
                      <span>灰度</span><span>鲜艳</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <label className="text-[11px] text-text-secondary">亮度</label>
                      <span className="text-[11px] text-text-secondary">{(brightness >= 0 ? '+' : '') + brightness.toFixed(2)}</span>
                    </div>
                    <input type="range" min={-1} max={1} step={0.05}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
                      <span>暗</span><span>亮</span>
                    </div>
                  </div>
                  {(saturation !== 0 || brightness !== 0) && (
                    <button
                      onClick={() => { setSaturation(0); setBrightness(0) }}
                      className="text-[11px] text-text-secondary hover:text-primary transition-colors"
                    >
                      重置色调
                    </button>
                  )}
                </div>

                <button onClick={() => setStep('process')} className="text-[11px] text-text-secondary hover:text-primary transition-colors">
                  ← 重新裁剪
                </button>
              </div>

              {/* Right: form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">面料名称 *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="例如：蓝色花朵棉布"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">材质</label>
                    <select value={material} onChange={(e) => setMaterial(e.target.value as MaterialLabel)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary/50 appearance-none">
                      {Object.entries(MATERIAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">花型</label>
                    <select value={patternType} onChange={(e) => setPatternType(e.target.value as PatternLabel)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary/50 appearance-none">
                      {Object.entries(PATTERN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">主要颜色（最多 5 个）</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button key={c.value} onClick={() => toggleColor(c.value)} title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${mainColors.includes(c.value) ? 'border-primary shadow-md scale-110' : 'border-white shadow-sm'}`}
                        style={{ backgroundColor: c.value }} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">库存尺寸</label>
                  <input type="text" value={sizeNote} onChange={(e) => setSizeNote(e.target.value)}
                    placeholder="例如：50cm × 70cm"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>
            </div>

            {/* Use cases */}
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">适合制作</label>
              <div className="flex flex-wrap gap-2">
                {USE_CASE_OPTIONS.map((uc) => (
                  <button key={uc} onClick={() => toggleUseCase(uc)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${useCases.includes(uc) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-text-secondary hover:border-primary/20'}`}>
                    {uc}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">标签（逗号分隔）</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="复古、春日、浅蓝…"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('process')} className="px-5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-card transition-colors">
                ← 返回
              </button>
              <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-soft disabled:opacity-50">
                {loading ? '保存中…' : editingId ? '更新面料 ✓' : '保存到面料库 ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
