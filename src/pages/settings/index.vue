<template>
  <view class="page">
    <view class="section">
      <text class="section-title">数据管理</text>
      <view class="card">
        <view class="card-item">
          <text class="item-label">面料素材</text>
          <text class="item-value">{{ fabricCount }} 个</text>
        </view>
        <view class="card-item">
          <text class="item-label">设计项目</text>
          <text class="item-value">{{ projectCount }} 个</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">关于</text>
      <view class="card">
        <view class="card-item">
          <text class="item-label">版本</text>
          <text class="item-value">1.0.0</text>
        </view>
        <view class="card-item">
          <text class="item-label">技术支持</text>
          <text class="item-value">PatchLab Team</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="danger-btn" @tap="clearData">
        <text>清除所有本地缓存</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFabricStore } from '../../stores/fabricStore'
import { useProjectStore } from '../../stores/projectStore'

const fabricStore = useFabricStore()
const projectStore = useProjectStore()

const fabricCount = computed(() => fabricStore.fabrics.length)
const projectCount = computed(() => projectStore.projects.length)

function clearData() {
  uni.showModal({
    title: '确认清除',
    content: '清除本地缓存后，需要重新加载云端数据。确定继续吗？',
    success(res) {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: $spacing-lg;
}

.section {
  margin-bottom: $spacing-xl;
}

.section-title {
  display: block;
  font-size: $font-sm;
  font-weight: 500;
  color: $color-text-secondary;
  margin-bottom: $spacing-sm;
  padding-left: $spacing-sm;
}

.card {
  background: $color-surface;
  border-radius: $radius-lg;
  overflow: hidden;
}

.card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 2rpx solid $color-border-light;

  &:last-child { border-bottom: none; }
}

.item-label {
  font-size: $font-base;
  color: $color-text-primary;
}

.item-value {
  font-size: $font-sm;
  color: $color-text-secondary;
}

.danger-btn {
  text-align: center;
  padding: $spacing-lg;
  background: $color-surface;
  border-radius: $radius-lg;
  color: $color-error;
  font-size: $font-base;

  &:active { opacity: 0.7; }
}
</style>
