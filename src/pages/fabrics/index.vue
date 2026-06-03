<template>
  <view class="page">
    <!-- Filter Bar -->
    <view class="filter-bar">
      <input
        class="search-input"
        type="text"
        placeholder="搜索面料..."
        :value="search"
        @input="onSearch"
      />
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-chips">
          <view
            v-for="m in materialOptions"
            :key="m.value"
            :class="['chip', material === m.value && 'chip-active']"
            @tap="toggleMaterial(m.value)"
          >
            <text>{{ m.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Fabric Grid -->
    <view v-if="filteredFabrics.length > 0" class="fabric-grid">
      <view
        v-for="fabric in filteredFabrics"
        :key="fabric.id"
        class="fabric-card"
        @tap="onSelectFabric(fabric)"
        @longpress="onLongPress(fabric)"
      >
        <image
          class="fabric-image"
          :src="fabric.processedImage"
          mode="aspectFill"
        />
        <view class="fabric-info">
          <text class="fabric-name">{{ fabric.name }}</text>
          <view class="fabric-tags">
            <text class="tag">{{ getMaterialLabel(fabric.material) }}</text>
            <text class="tag">{{ getPatternLabel(fabric.patternType) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Empty State -->
    <view v-else class="empty">
      <text class="empty-icon">🧵</text>
      <text class="empty-text">还没有面料</text>
      <view class="empty-btn" @tap="goUpload">
        <text>上传第一块面料</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFabricStore } from '../../stores/fabricStore'
import { MATERIAL_LABELS, PATTERN_LABELS } from '../../utils/colors'
import type { FabricTexture } from '../../types'

const fabricStore = useFabricStore()

const search = ref('')
const material = ref('')

const materialOptions = computed(() => [
  { label: '全部', value: '' },
  ...Object.entries(MATERIAL_LABELS).map(([value, label]) => ({ value, label })),
])

const filteredFabrics = computed(() =>
  fabricStore.getFiltered(search.value, material.value, '', '')
)

function getMaterialLabel(key: string) { return MATERIAL_LABELS[key] || key }
function getPatternLabel(key: string) { return PATTERN_LABELS[key] || key }

function onSearch(e: any) { search.value = e.detail.value }
function toggleMaterial(val: string) { material.value = material.value === val ? '' : val }

function onSelectFabric(fabric: FabricTexture) {
  uni.navigateTo({ url: `/pages/upload/index?fabric=${fabric.id}` })
}

function onLongPress(fabric: FabricTexture) {
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success(res) {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: `/pages/upload/index?fabric=${fabric.id}` })
      } else if (res.tapIndex === 1) {
        confirmDelete(fabric)
      }
    },
  })
}

function confirmDelete(fabric: FabricTexture) {
  uni.showModal({
    title: '确认删除',
    content: `确定删除「${fabric.name}」吗？`,
    success(res) {
      if (res.confirm) {
        fabricStore.remove(fabric.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    },
  })
}

function goUpload() {
  uni.navigateTo({ url: '/pages/upload/index' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.filter-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: $spacing-md;
  background: $color-background;
}

.search-input {
  width: 100%;
  height: 72rpx;
  padding: 0 $spacing-md;
  background: $color-surface;
  border: 2rpx solid $color-border-light;
  border-radius: $radius-full;
  font-size: $font-sm;
}

.filter-scroll {
  margin-top: $spacing-sm;
  white-space: nowrap;
}

.filter-chips {
  display: inline-flex;
  gap: $spacing-sm;
}

.chip {
  display: inline-flex;
  padding: $spacing-xs $spacing-md;
  background: $color-surface;
  border: 2rpx solid $color-border;
  border-radius: $radius-full;
  font-size: $font-xs;
  color: $color-text-secondary;
}

.chip-active {
  background: $color-primary-light;
  border-color: $color-primary;
  color: $color-primary-dark;
}

.fabric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  padding: 0 $spacing-md;
}

.fabric-card {
  background: $color-surface;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;

  &:active {
    opacity: 0.9;
  }
}

.fabric-image {
  width: 100%;
  height: 260rpx;
}

.fabric-info {
  padding: $spacing-sm $spacing-md;
}

.fabric-name {
  display: block;
  font-size: $font-sm;
  font-weight: 500;
  color: $color-text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fabric-tags {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
}

.tag {
  font-size: $font-xs;
  color: $color-text-tertiary;
  background: $color-surface-secondary;
  padding: 2rpx $spacing-xs;
  border-radius: $radius-sm;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 96rpx;
}

.empty-text {
  margin-top: $spacing-md;
  font-size: $font-base;
  color: $color-text-secondary;
}

.empty-btn {
  margin-top: $spacing-lg;
  padding: $spacing-sm $spacing-xl;
  background: $color-primary;
  border-radius: $radius-full;
  color: white;
  font-size: $font-sm;
}
</style>
