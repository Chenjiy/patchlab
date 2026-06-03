<template>
  <view class="studio-page">
    <!-- Top Toolbar -->
    <view class="toolbar">
      <view class="toolbar-left">
        <view class="toolbar-btn" @tap="goBack">
          <text>←</text>
        </view>
        <text class="project-name" @tap="editName">{{ project?.name || '新设计' }}</text>
      </view>
      <view class="toolbar-right">
        <view class="toolbar-btn" @tap="undo" :class="{ disabled: !canUndo }">
          <text>↩</text>
        </view>
        <view class="toolbar-btn" @tap="redo" :class="{ disabled: !canRedo }">
          <text>↪</text>
        </view>
        <view class="toolbar-btn primary" @tap="saveCurrentProject">
          <text>保存</text>
        </view>
      </view>
    </view>

    <!-- Canvas Area -->
    <view class="canvas-area" id="canvas-container">
      <!-- #ifdef MP-WEIXIN -->
      <canvas
        id="design-canvas"
        type="2d"
        class="design-canvas"
        disable-scroll
        @touchstart="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      />
      <!-- #endif -->
      <!-- H5: canvas is created programmatically in initCanvasH5 -->
      <view v-if="!project" class="canvas-empty">
        <text class="empty-text">选择模板开始设计</text>
      </view>
    </view>

    <!-- Bottom Panel -->
    <view class="bottom-panel">
      <view class="panel-tabs">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          :class="['panel-tab', activeTab === tab.key && 'panel-tab-active']"
          @tap="activeTab = tab.key"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <scroll-view scroll-y class="panel-content">
        <!-- Template Selector -->
        <view v-if="activeTab === 'template'" class="template-grid">
          <view
            v-for="t in templates"
            :key="t.id"
            :class="['template-card', project?.templateType === t.id && 'template-card-active']"
            @tap="selectTemplate(t.id)"
          >
            <text class="template-icon">{{ t.icon }}</text>
            <text class="template-name">{{ t.name }}</text>
            <text class="template-desc">{{ t.description }}</text>
          </view>
        </view>

        <!-- Fabric Panel -->
        <view v-if="activeTab === 'fabric'" class="fabric-panel">
          <text class="panel-title">选择面料</text>
          <view class="mini-fabric-grid">
            <view
              v-for="f in fabrics"
              :key="f.id"
              class="mini-fabric-card"
              @tap="onFabricSelect(f.id)"
            >
              <image :src="f.processedImage" mode="aspectFill" class="mini-fabric-img" />
              <text class="mini-fabric-name">{{ f.name }}</text>
            </view>
          </view>
        </view>

        <!-- Shape Panel -->
        <view v-if="activeTab === 'shape'" class="shape-panel">
          <text class="panel-title">选择形状</text>
          <view class="shape-grid">
            <view
              v-for="s in shapes"
              :key="s.id"
              class="shape-item"
              @tap="onShapeSelect(s.id)"
            >
              <text class="shape-name">{{ s.name }}</text>
            </view>
          </view>
        </view>

        <!-- Accessory Panel -->
        <view v-if="activeTab === 'accessory'" class="accessory-panel">
          <text class="panel-title">添加配件</text>
          <view class="accessory-list">
            <view class="accessory-item" @tap="addAccessory('zipper')"><text>🔗 拉链</text></view>
            <view class="accessory-item" @tap="addAccessory('webbing')"><text>🎀 织带</text></view>
            <view class="accessory-item" @tap="addAccessory('loop-tab')"><text>🏷️ 挂耳</text></view>
            <view class="accessory-item" @tap="addAccessory('snap-button')"><text>⚙️ 按扣</text></view>
            <view class="accessory-item" @tap="addAccessory('strap')"><text>👜 肩带</text></view>
            <view class="accessory-item" @tap="addAccessory('handle')"><text>🤚 提手</text></view>
            <view class="accessory-item" @tap="addAccessory('d-ring')"><text>⭕ D环</text></view>
            <view class="accessory-item" @tap="addAccessory('buckle')"><text>🪣 扣具</text></view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useProjectStore } from '../../stores/projectStore'
import { useFabricStore } from '../../stores/fabricStore'
import { CANVAS_TEMPLATES } from '../../data/templates'
import { MASK_SHAPES } from '../../data/maskShapes'
import { generateId } from '../../utils/id'
import { CanvasEngine, SceneBuilder } from '../../engine'
import type { TemplateType, AccessoryType, PatchLayer, Accessory } from '../../types'

const projectStore = useProjectStore()
const fabricStore = useFabricStore()

const project = computed(() => projectStore.activeProject)
const fabrics = computed(() => fabricStore.fabrics)
const templates = CANVAS_TEMPLATES
const shapes = MASK_SHAPES

const canUndo = computed(() => projectStore.history.length > 0)
const canRedo = computed(() => projectStore.future.length > 0)

type TabKey = 'template' | 'fabric' | 'shape' | 'accessory'
const tabs: { key: TabKey; label: string }[] = [
  { key: 'template', label: '模板' },
  { key: 'fabric', label: '面料' },
  { key: 'shape', label: '形状' },
  { key: 'accessory', label: '配件' },
]
const activeTab = ref<TabKey>('template')

const pendingFabricId = ref<string | null>(null)

// Engine
let engine: CanvasEngine | null = null
let sceneBuilder: SceneBuilder | null = null

onLoad((query: any) => {
  if (query?.project) {
    const p = projectStore.getById(query.project)
    if (p) projectStore.setActiveProject(p)
  }
})

let canvasEl: HTMLCanvasElement | null = null

onMounted(() => {
  // Wait for layout to stabilize before init
  setTimeout(() => initCanvas(), 200)
})

onBeforeUnmount(() => {
  if (engine) {
    engine.destroy()
    engine = null
    sceneBuilder = null
  }
})

function initCanvas() {
  // #ifdef H5
  initCanvasH5()
  // #endif
  // #ifdef MP-WEIXIN
  initCanvasMp()
  // #endif
}

function initCanvasH5() {
  const container = document.querySelector('#canvas-container') as HTMLElement
    || document.querySelector('.canvas-area') as HTMLElement
  if (!container) {
    setTimeout(() => initCanvasH5(), 100)
    return
  }
  const w = container.clientWidth
  const h = container.clientHeight
  if (w === 0 || h === 0) {
    setTimeout(() => initCanvasH5(), 100)
    return
  }
  // Remove any existing uni-canvas wrapper or old canvas
  const existingUniCanvas = container.querySelector('uni-canvas')
  if (existingUniCanvas) existingUniCanvas.remove()
  const existingCanvas = container.querySelector('canvas')
  if (existingCanvas) existingCanvas.remove()

  // Create a fresh canvas element ourselves
  const el = document.createElement('canvas')
  el.id = 'design-canvas-h5'
  el.style.width = w + 'px'
  el.style.height = h + 'px'
  el.style.display = 'block'
  el.style.touchAction = 'none'
  container.insertBefore(el, container.firstChild)
  canvasEl = el

  console.log('[Studio] initCanvasH5', w, h)
  engine = new CanvasEngine()
  engine.init(el, w, h)
  sceneBuilder = new SceneBuilder(engine)
  if (project.value) {
    sceneBuilder.buildFromProject(project.value)
  }

  // Pointer events
  el.addEventListener('pointerdown', handlePointerDown)
  el.addEventListener('pointermove', handlePointerMove)
  el.addEventListener('pointerup', handlePointerUp)
  el.addEventListener('pointercancel', handlePointerUp)
}

function initCanvasMp() {
  const query = uni.createSelectorQuery()
  query.select('#design-canvas').fields({ node: true, size: true }, (res: any) => {
    if (!res || !res.node) return
    const canvas = res.node as HTMLCanvasElement
    canvasEl = canvas
    engine = new CanvasEngine()
    engine.init(canvas, res.width, res.height)
    sceneBuilder = new SceneBuilder(engine)
    if (project.value) {
      sceneBuilder.buildFromProject(project.value)
    }
  }).exec()
}

// Rebuild scene when project identity changes (not on every deep mutation)
let lastProjectId = ''
let lastBuildKey = ''

watch(project, (newProject) => {
  if (!sceneBuilder || !engine) return
  if (!newProject) {
    sceneBuilder.clear()
    engine.markDirty()
    lastProjectId = ''
    lastBuildKey = ''
    return
  }

  // Build a key from structural data (template, layers count, accessories count, base fabric)
  const buildKey = [
    newProject.id,
    newProject.templateType,
    newProject.baseFabricId,
    newProject.patchLayers.length,
    newProject.patchLayers.map((l) => `${l.id}:${l.maskShapeId}:${l.fabricTextureId}`).join(','),
    newProject.accessories.length,
    newProject.accessories.map((a) => `${a.id}:${a.type}`).join(','),
  ].join('|')

  if (buildKey !== lastBuildKey || newProject.id !== lastProjectId) {
    sceneBuilder.buildFromProject(newProject)
    lastProjectId = newProject.id
    lastBuildKey = buildKey
  }
}, { deep: true })

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}

function editName() {
  if (!project.value) return
  // #ifdef H5
  const name = prompt('项目名称', project.value.name)
  if (name && name.trim()) {
    projectStore.updateProject({ name: name.trim() })
  }
  // #endif
}

function undo() { projectStore.undo() }
function redo() { projectStore.redo() }

async function saveCurrentProject() {
  if (!project.value) return
  uni.showLoading({ title: '保存中...' })
  try {
    await projectStore.save()
    uni.hideLoading()
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function selectTemplate(templateType: TemplateType) {
  const template = CANVAS_TEMPLATES.find((t) => t.id === templateType)!
  if (!project.value) {
    const baseFabricId = fabrics.value.length > 0 ? fabrics.value[0].id : ''
    projectStore.setActiveProject({
      id: generateId(),
      name: '新设计',
      templateType,
      baseFabricId,
      canvasWidth: template.width,
      canvasHeight: template.height,
      baseFabricScale: 1,
      baseFabricOffsetX: 0,
      baseFabricOffsetY: 0,
      patchLayers: [],
      accessories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } else {
    projectStore.updateProject({
      templateType,
      canvasWidth: template.width,
      canvasHeight: template.height,
    })
  }
  activeTab.value = 'fabric'
}

function onFabricSelect(fabricId: string) {
  pendingFabricId.value = fabricId
  if (project.value && !project.value.baseFabricId) {
    projectStore.updateProject({ baseFabricId: fabricId })
  }
  activeTab.value = 'shape'
}

function onShapeSelect(shapeId: string) {
  if (!project.value || !pendingFabricId.value) {
    uni.showToast({ title: '请先选择面料', icon: 'none' })
    return
  }
  const shape = shapes.find((s) => s.id === shapeId)!
  const newLayer: PatchLayer = {
    id: generateId(),
    maskShapeId: shapeId,
    fabricTextureId: pendingFabricId.value,
    x: project.value.canvasWidth / 2 - shape.defaultWidth / 2,
    y: project.value.canvasHeight / 2 - shape.defaultHeight / 2,
    width: shape.defaultWidth,
    height: shape.defaultHeight,
    rotation: 0,
    textureScale: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
    textureRotation: 0,
    edgeStyle: 'none',
    zIndex: project.value.patchLayers.length,
  }
  projectStore.updateProject({
    patchLayers: [...project.value.patchLayers, newLayer],
  })
  pendingFabricId.value = null
}

function addAccessory(type: AccessoryType) {
  if (!project.value) return
  const accessory: Accessory = {
    id: generateId(),
    type,
    x: project.value.canvasWidth / 2 - 40,
    y: project.value.canvasHeight / 2 - 20,
    width: 80,
    height: 40,
    rotation: 0,
    color: '#8B6355',
    zIndex: project.value.accessories.length,
  }
  projectStore.updateProject({
    accessories: [...project.value.accessories, accessory],
  })
}

// --- Interaction State ---
let dragging = false
let dragNode: any = null
let lastPos = { x: 0, y: 0 }

/**
 * Convert a pointer/touch event to canvas-local coordinates
 */
function getCanvasPos(e: PointerEvent | MouseEvent | TouchEvent | any): { x: number; y: number } {
  // Pointer/Mouse events (H5)
  if (e.clientX !== undefined && canvasEl) {
    const rect = canvasEl.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  // Touch events (mini-program: touch.x/y are already canvas-relative)
  const touch = e.touches?.[0] || e.changedTouches?.[0]
  if (touch) {
    if (touch.x !== undefined) {
      return { x: touch.x, y: touch.y }
    }
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect()
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
  }
  return { x: 0, y: 0 }
}

// --- H5 Pointer Events (bound directly to canvas DOM) ---
function handlePointerDown(e: PointerEvent) {
  if (!engine || !sceneBuilder) return
  ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  const pos = getCanvasPos(e)
  console.log(`[Drag] pointerdown at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`)
  const node = engine.getNodeAt(pos.x, pos.y)
  console.log(`[Drag] hitTest result:`, node?.id || 'null')
  startDrag(pos)
}

function handlePointerMove(e: PointerEvent) {
  if (!dragging || !dragNode || !engine) return
  e.preventDefault()
  const pos = getCanvasPos(e)
  moveDrag(pos)
}

function handlePointerUp(e: PointerEvent) {
  endDrag()
}

// --- Mini-program Touch Events (bound via template) ---
function onTouchStart(e: any) {
  if (!engine || !sceneBuilder) return
  const pos = getCanvasPos(e)
  startDrag(pos)
}

function onTouchMove(e: any) {
  if (!dragging || !dragNode || !engine) return
  const pos = getCanvasPos(e)
  moveDrag(pos)
}

function onTouchEnd(_e: any) {
  endDrag()
}

// --- Shared drag logic ---
function startDrag(pos: { x: number; y: number }) {
  if (!engine || !sceneBuilder) return
  const node = engine.getNodeAt(pos.x, pos.y)
  if (node && node.id !== 'base-fill') {
    dragging = true
    dragNode = node
    lastPos = pos
    // Select this node
    const all = sceneBuilder.getAllSelectableNodes()
    all.forEach((n) => { n.selected = (n === node) })
    engine.markDirty()
  } else {
    // Deselect all
    dragging = false
    dragNode = null
    const all = sceneBuilder.getAllSelectableNodes()
    all.forEach((n) => { n.selected = false })
    engine.markDirty()
  }
}

function moveDrag(pos: { x: number; y: number }) {
  if (!dragging || !dragNode || !engine) return
  const dx = (pos.x - lastPos.x) / engine.viewport.scale
  const dy = (pos.y - lastPos.y) / engine.viewport.scale
  dragNode.x += dx
  dragNode.y += dy
  lastPos = pos
  engine.markDirty()
}

function endDrag() {
  if (dragging && dragNode && project.value) {
    const layer = project.value.patchLayers.find((l) => l.id === dragNode.id)
    if (layer) {
      projectStore.updateLayer(dragNode.id, { x: dragNode.x, y: dragNode.y })
    }
    const accessory = project.value.accessories.find((a) => a.id === dragNode.id)
    if (accessory) {
      projectStore.updateAccessory(dragNode.id, { x: dragNode.x, y: dragNode.y })
    }
  }
  dragging = false
  dragNode = null
}

// Mouse events for H5 (fallback if pointer events don't fire via template)
function onMouseDown(e: MouseEvent) {
  // Already handled by pointer events directly
}
function onMouseMove(e: MouseEvent) {}
function onMouseUp(e: MouseEvent) {}
</script>

<style lang="scss" scoped>
.studio-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-surface-secondary;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-md;
  height: 88rpx;
  background: $color-surface;
  box-shadow: $shadow-sm;
  // Safe area for notch
  padding-top: env(safe-area-inset-top);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.toolbar-btn {
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-md;
  font-size: $font-sm;
  color: $color-text-secondary;

  &:active { opacity: 0.7; }
  &.disabled { opacity: 0.3; pointer-events: none; }
  &.primary {
    background: $color-primary;
    color: white;
  }
}

.project-name {
  font-size: $font-base;
  font-weight: 500;
  color: $color-text-primary;
}

.canvas-area {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.design-canvas {
  width: 100%;
  height: 100%;
}

.canvas-empty {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: $font-base;
  color: $color-text-tertiary;
}

.bottom-panel {
  background: $color-surface;
  border-top-left-radius: $radius-lg;
  border-top-right-radius: $radius-lg;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  max-height: 45vh;
}

.panel-tabs {
  display: flex;
  border-bottom: 2rpx solid $color-border-light;
}

.panel-tab {
  flex: 1;
  text-align: center;
  padding: $spacing-md 0;
  font-size: $font-sm;
  color: $color-text-secondary;
}

.panel-tab-active {
  color: $color-primary-dark;
  font-weight: 600;
  border-bottom: 4rpx solid $color-primary;
}

.panel-content {
  height: 320rpx;
  padding: $spacing-md;
}

.panel-title {
  display: block;
  font-size: $font-sm;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md $spacing-sm;
  background: $color-surface-secondary;
  border-radius: $radius-md;
  border: 2rpx solid transparent;

  &:active { opacity: 0.8; }
}

.template-card-active {
  border-color: $color-primary;
  background: $color-primary-light;
}

.template-icon { font-size: 40rpx; }
.template-name { font-size: $font-xs; font-weight: 500; margin-top: 4rpx; }
.template-desc { font-size: 20rpx; color: $color-text-tertiary; }

.mini-fabric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
}

.mini-fabric-card {
  text-align: center;
  &:active { opacity: 0.8; }
}

.mini-fabric-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-sm;
}

.mini-fabric-name {
  display: block;
  font-size: 20rpx;
  color: $color-text-secondary;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
}

.shape-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md;
  background: $color-surface-secondary;
  border-radius: $radius-md;
  font-size: $font-xs;
  &:active { opacity: 0.8; }
}

.accessory-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.accessory-item {
  padding: $spacing-md;
  background: $color-surface-secondary;
  border-radius: $radius-md;
  font-size: $font-sm;
  &:active { opacity: 0.8; }
}
</style>
