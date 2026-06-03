<template>
  <view class="page">
    <view v-if="projects.length > 0" class="project-grid">
      <view
        v-for="p in projects"
        :key="p.id"
        class="project-card"
        @tap="openProject(p.id)"
        @longpress="onLongPress(p)"
      >
        <image
          v-if="p.previewImage"
          :src="p.previewImage"
          mode="aspectFill"
          class="project-preview"
        />
        <view v-else class="project-placeholder">
          <text>{{ getTemplateIcon(p.templateType) }}</text>
        </view>
        <view class="project-info">
          <text class="project-name">{{ p.name }}</text>
          <text class="project-meta">{{ getTemplateName(p.templateType) }} · {{ p.patchLayers.length }}层</text>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-icon">🎨</text>
      <text class="empty-text">还没有设计作品</text>
      <view class="empty-btn" @tap="goStudio">
        <text>开始第一个设计</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import { CANVAS_TEMPLATES } from '../../data/templates'
import type { DesignProject, TemplateType } from '../../types'

const projectStore = useProjectStore()
const projects = computed(() => projectStore.projects)

function getTemplateIcon(type: TemplateType) {
  return CANVAS_TEMPLATES.find((t) => t.id === type)?.icon || '✂️'
}

function getTemplateName(type: TemplateType) {
  return CANVAS_TEMPLATES.find((t) => t.id === type)?.name || '自定义'
}

function openProject(id: string) {
  uni.navigateTo({ url: `/pages/studio/index?project=${id}` })
}

function onLongPress(project: DesignProject) {
  uni.showActionSheet({
    itemList: ['复制', '导出图片', '删除'],
    success(res) {
      if (res.tapIndex === 0) duplicateProject(project.id)
      else if (res.tapIndex === 1) exportProject(project)
      else if (res.tapIndex === 2) confirmDelete(project)
    },
  })
}

async function duplicateProject(id: string) {
  try {
    await projectStore.duplicate(id)
    uni.showToast({ title: '已复制', icon: 'success' })
  } catch {
    uni.showToast({ title: '复制失败', icon: 'none' })
  }
}

function exportProject(_project: DesignProject) {
  // TODO: Open project in studio and export via canvas
  uni.showToast({ title: '请在设计页面导出', icon: 'none' })
}

function confirmDelete(project: DesignProject) {
  uni.showModal({
    title: '确认删除',
    content: `确定删除「${project.name}」吗？`,
    success(res) {
      if (res.confirm) {
        projectStore.remove(project.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    },
  })
}

function goStudio() {
  uni.switchTab({ url: '/pages/studio/index' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: $spacing-md;
  padding-bottom: 120rpx;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.project-card {
  background: $color-surface;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;

  &:active { opacity: 0.9; }
}

.project-preview {
  width: 100%;
  height: 280rpx;
}

.project-placeholder {
  width: 100%;
  height: 280rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-surface-secondary;
  font-size: 72rpx;
}

.project-info {
  padding: $spacing-sm $spacing-md;
}

.project-name {
  display: block;
  font-size: $font-sm;
  font-weight: 500;
  color: $color-text-primary;
}

.project-meta {
  display: block;
  font-size: $font-xs;
  color: $color-text-tertiary;
  margin-top: 4rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 240rpx;
}

.empty-icon { font-size: 96rpx; }

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
