<template>
  <view class="page">
    <!-- Step indicator -->
    <view class="steps">
      <view v-for="(s, i) in steps" :key="i" :class="['step', step >= i && 'step-active']">
        <view class="step-dot">{{ i + 1 }}</view>
        <text class="step-label">{{ s }}</text>
      </view>
    </view>

    <!-- Step 0: Choose Image -->
    <view v-if="step === 0" class="step-content">
      <view class="upload-area" @tap="chooseImage">
        <text class="upload-icon">📷</text>
        <text class="upload-text">点击选择面料照片</text>
        <text class="upload-hint">支持从相册选择或拍照</text>
      </view>
    </view>

    <!-- Step 1: Crop -->
    <view v-if="step === 1" class="step-content">
      <view class="crop-preview">
        <image :src="imagePath" mode="aspectFit" class="preview-img" />
      </view>
      <view class="btn-row">
        <view class="btn btn-secondary" @tap="step = 0">重选</view>
        <view class="btn btn-primary" @tap="step = 2">下一步</view>
      </view>
    </view>

    <!-- Step 2: Details Form -->
    <view v-if="step === 2" class="step-content">
      <view class="form">
        <view class="form-item">
          <text class="form-label">名称</text>
          <input class="form-input" v-model="form.name" placeholder="给面料起个名字" />
        </view>

        <view class="form-item">
          <text class="form-label">材质</text>
          <picker :range="materialKeys" :range-key="'label'" @change="onMaterialChange">
            <view class="form-picker">{{ getMaterialLabel(form.material) || '选择材质' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">花纹</text>
          <picker :range="patternKeys" :range-key="'label'" @change="onPatternChange">
            <view class="form-picker">{{ getPatternLabel(form.patternType) || '选择花纹' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">主要颜色</text>
          <view class="color-dots">
            <view
              v-for="c in PRESET_COLORS"
              :key="c.value"
              :class="['color-dot', form.mainColors.includes(c.value) && 'color-dot-active']"
              :style="{ backgroundColor: c.value }"
              @tap="toggleColor(c.value)"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">尺寸备注</text>
          <input class="form-input" v-model="form.sizeNote" placeholder="例：10×10cm 一块" />
        </view>
      </view>

      <view class="btn-row">
        <view class="btn btn-secondary" @tap="step = 1">上一步</view>
        <view class="btn btn-primary" @tap="saveFabric">保存</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFabricStore } from '../../stores/fabricStore'
import { generateId } from '../../utils/id'
import { PRESET_COLORS, MATERIAL_LABELS, PATTERN_LABELS } from '../../utils/colors'
import type { FabricTexture } from '../../types'

const fabricStore = useFabricStore()

const steps = ['选择照片', '裁剪', '填写信息']
const step = ref(0)
const imagePath = ref('')
const editId = ref<string | null>(null)

const form = reactive({
  name: '',
  material: '' as FabricTexture['material'],
  patternType: '' as FabricTexture['patternType'],
  mainColors: [] as string[],
  sizeNote: '',
})

const materialKeys = Object.entries(MATERIAL_LABELS).map(([value, label]) => ({ value, label }))
const patternKeys = Object.entries(PATTERN_LABELS).map(([value, label]) => ({ value, label }))

function getMaterialLabel(key: string) { return MATERIAL_LABELS[key] || '' }
function getPatternLabel(key: string) { return PATTERN_LABELS[key] || '' }

onLoad((query: any) => {
  if (query?.fabric) {
    const existing = fabricStore.getById(query.fabric)
    if (existing) {
      editId.value = existing.id
      imagePath.value = existing.processedImage
      form.name = existing.name
      form.material = existing.material
      form.patternType = existing.patternType
      form.mainColors = [...existing.mainColors]
      form.sizeNote = existing.sizeNote
      step.value = 2
    }
  }
})

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      imagePath.value = res.tempFilePaths[0]
      step.value = 1
    },
  })
}

function onMaterialChange(e: any) {
  form.material = materialKeys[e.detail.value].value as FabricTexture['material']
}

function onPatternChange(e: any) {
  form.patternType = patternKeys[e.detail.value].value as FabricTexture['patternType']
}

function toggleColor(color: string) {
  const idx = form.mainColors.indexOf(color)
  if (idx >= 0) form.mainColors.splice(idx, 1)
  else form.mainColors.push(color)
}

async function saveFabric() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  if (!form.material) {
    uni.showToast({ title: '请选择材质', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...' })
  try {
    const fabric: FabricTexture = {
      id: editId.value || generateId(),
      name: form.name.trim(),
      originalImage: imagePath.value,
      processedImage: imagePath.value,
      material: form.material,
      patternType: form.patternType || 'other',
      mainColors: form.mainColors,
      sizeNote: form.sizeNote,
      useCases: [],
      tags: [],
      createdAt: new Date().toISOString(),
    }
    await fabricStore.save(fabric)
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: $spacing-md;
}

.steps {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  padding: $spacing-lg 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.4;
}

.step-active {
  opacity: 1;
}

.step-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: $color-primary-light;
  color: $color-primary-dark;
  font-size: $font-sm;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-active .step-dot {
  background: $color-primary;
  color: white;
}

.step-label {
  margin-top: $spacing-xs;
  font-size: $font-xs;
  color: $color-text-secondary;
}

.step-content {
  margin-top: $spacing-lg;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
  background: $color-surface;
  border: 4rpx dashed $color-border;
  border-radius: $radius-lg;

  &:active {
    border-color: $color-primary;
    background: $color-primary-light;
  }
}

.upload-icon {
  font-size: 80rpx;
}

.upload-text {
  margin-top: $spacing-md;
  font-size: $font-md;
  color: $color-text-primary;
}

.upload-hint {
  margin-top: $spacing-xs;
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.crop-preview {
  display: flex;
  justify-content: center;
  padding: $spacing-lg;
}

.preview-img {
  width: 500rpx;
  height: 500rpx;
  border-radius: $radius-md;
}

.form {
  background: $color-surface;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.form-item {
  margin-bottom: $spacing-lg;
}

.form-label {
  display: block;
  font-size: $font-sm;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
}

.form-input {
  width: 100%;
  height: 72rpx;
  padding: 0 $spacing-md;
  border: 2rpx solid $color-border-light;
  border-radius: $radius-md;
  font-size: $font-sm;
}

.form-picker {
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 $spacing-md;
  border: 2rpx solid $color-border-light;
  border-radius: $radius-md;
  font-size: $font-sm;
  color: $color-text-secondary;
}

.color-dots {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.color-dot {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 3rpx solid $color-border-light;
}

.color-dot-active {
  border-color: $color-primary-dark;
  box-shadow: 0 0 0 4rpx $color-primary-light;
}

.btn-row {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-xl;
}

.btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  font-size: $font-base;
  font-weight: 500;
}

.btn-primary {
  background: $color-primary;
  color: white;
}

.btn-secondary {
  background: $color-surface;
  border: 2rpx solid $color-border;
  color: $color-text-secondary;
}
</style>
