<template>
  <view class="page">
    <!-- Loading State -->
    <view v-if="appStore.loading" class="loading-wrapper">
      <view class="spinner" />
      <text class="loading-text">加载中…</text>
    </view>

    <!-- Error State -->
    <view v-else-if="appStore.initError" class="error-wrapper">
      <text class="error-title">连接失败</text>
      <text class="error-msg">{{ appStore.initError }}</text>
      <text class="error-hint">请检查网络连接</text>
    </view>

    <!-- Content -->
    <view v-else class="content">
      <!-- Hero Section -->
      <view class="hero">
        <text class="hero-title">PatchLab</text>
        <text class="hero-subtitle">布艺拼贴设计工坊</text>
      </view>

      <!-- Stats -->
      <view class="stats">
        <view class="stat-item">
          <text class="stat-number">{{ fabricCount }}</text>
          <text class="stat-label">面料素材</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ projectCount }}</text>
          <text class="stat-label">设计作品</text>
        </view>
      </view>

      <!-- Quick Actions -->
      <view class="actions">
        <view class="action-card" @tap="goUpload">
          <text class="action-icon">📷</text>
          <text class="action-title">上传面料</text>
          <text class="action-desc">拍摄或选择布料照片</text>
        </view>
        <view class="action-card" @tap="goStudio">
          <text class="action-icon">✂️</text>
          <text class="action-title">开始设计</text>
          <text class="action-desc">创建拼贴设计方案</text>
        </view>
        <view class="action-card" @tap="goGallery">
          <text class="action-icon">🎨</text>
          <text class="action-title">我的作品</text>
          <text class="action-desc">查看已保存的设计</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useFabricStore } from '../../stores/fabricStore'
import { useProjectStore } from '../../stores/projectStore'

const appStore = useAppStore()
const fabricStore = useFabricStore()
const projectStore = useProjectStore()

const fabricCount = computed(() => fabricStore.fabrics.length)
const projectCount = computed(() => projectStore.projects.length)

function goUpload() {
  uni.navigateTo({ url: '/pages/upload/index' })
}

function goStudio() {
  uni.navigateTo({ url: '/pages/studio/index' })
}

function goGallery() {
  uni.switchTab({ url: '/pages/gallery/index' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.loading-wrapper,
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid $color-primary-light;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: $spacing-md;
  color: $color-text-secondary;
  font-size: $font-sm;
}

.error-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $color-text-primary;
}

.error-msg {
  margin-top: $spacing-sm;
  font-size: $font-sm;
  color: $color-text-secondary;
}

.error-hint {
  margin-top: $spacing-md;
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.content {
  padding: $spacing-lg;
}

.hero {
  text-align: center;
  padding: $spacing-xl 0;
}

.hero-title {
  display: block;
  font-size: 64rpx;
  font-weight: 700;
  color: $color-text-primary;
  letter-spacing: 2rpx;
}

.hero-subtitle {
  display: block;
  margin-top: $spacing-sm;
  font-size: $font-base;
  color: $color-text-secondary;
}

.stats {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin: $spacing-lg 0;
  padding: $spacing-lg;
  background: $color-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: $font-xl;
  font-weight: 700;
  color: $color-primary-dark;
}

.stat-label {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-xs;
  color: $color-text-secondary;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-lg;
}

.action-card {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
  background: $color-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

.action-icon {
  font-size: 56rpx;
  margin-right: $spacing-lg;
}

.action-title {
  font-size: $font-md;
  font-weight: 600;
  color: $color-text-primary;
}

.action-desc {
  display: block;
  margin-top: 4rpx;
  font-size: $font-xs;
  color: $color-text-secondary;
}
</style>
