import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getProjects,
  getProjectById,
  saveProject as saveProjectService,
  deleteProject as deleteProjectService,
  duplicateProject as duplicateProjectService,
  cacheProject,
} from '../services/storageService'
import type { DesignProject, PatchLayer, Accessory } from '../types'

const MAX_HISTORY = 50

export const useProjectStore = defineStore('project', () => {
  const projects = ref<DesignProject[]>([])

  function reload() {
    projects.value = [...getProjects()]
  }

  // Active project state (for studio)
  const activeProject = ref<DesignProject | null>(null)
  const history = ref<DesignProject[]>([])
  const future = ref<DesignProject[]>([])

  function setActiveProject(project: DesignProject | null) {
    activeProject.value = project
    history.value = []
    future.value = []
  }

  function updateProject(updates: Partial<DesignProject>) {
    if (!activeProject.value) return
    history.value = [...history.value.slice(-(MAX_HISTORY - 1)), { ...activeProject.value }]
    future.value = []
    activeProject.value = { ...activeProject.value, ...updates, updatedAt: new Date().toISOString() }
    cacheProject(activeProject.value)
  }

  function updateLayer(id: string, updates: Partial<PatchLayer>) {
    if (!activeProject.value) return
    const layers = activeProject.value.patchLayers.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    )
    updateProject({ patchLayers: layers })
  }

  function updateAccessory(id: string, updates: Partial<Accessory>) {
    if (!activeProject.value) return
    const accessories = activeProject.value.accessories.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    )
    updateProject({ accessories })
  }

  function undo() {
    if (history.value.length === 0 || !activeProject.value) return
    future.value = [{ ...activeProject.value }, ...future.value.slice(0, MAX_HISTORY - 1)]
    activeProject.value = history.value[history.value.length - 1]
    history.value = history.value.slice(0, -1)
    cacheProject(activeProject.value)
  }

  function redo() {
    if (future.value.length === 0 || !activeProject.value) return
    history.value = [...history.value.slice(-(MAX_HISTORY - 1)), { ...activeProject.value }]
    activeProject.value = future.value[0]
    future.value = future.value.slice(1)
    cacheProject(activeProject.value)
  }

  function getById(id: string) {
    return getProjectById(id)
  }

  async function save(project?: DesignProject) {
    await saveProjectService(project ?? activeProject.value!)
    reload()
  }

  async function remove(id: string) {
    await deleteProjectService(id)
    reload()
  }

  async function duplicate(id: string) {
    const result = await duplicateProjectService(id)
    reload()
    return result
  }

  return {
    projects,
    reload,
    activeProject,
    history,
    future,
    setActiveProject,
    updateProject,
    updateLayer,
    updateAccessory,
    undo,
    redo,
    getById,
    save,
    remove,
    duplicate,
  }
})
