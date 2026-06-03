import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getFabrics,
  getFabricById,
  saveFabric as saveFabricService,
  deleteFabric as deleteFabricService,
} from '../services/storageService'
import type { FabricTexture } from '../types'

export const useFabricStore = defineStore('fabric', () => {
  const fabrics = ref<FabricTexture[]>([])

  function reload() {
    fabrics.value = [...getFabrics()]
  }

  function getById(id: string): FabricTexture | undefined {
    return getFabricById(id)
  }

  function getFiltered(search: string, material: string, pattern: string, color: string): FabricTexture[] {
    return fabrics.value.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
      if (material && f.material !== material) return false
      if (pattern && f.patternType !== pattern) return false
      if (color && !f.mainColors.includes(color)) return false
      return true
    })
  }

  async function save(fabric: FabricTexture) {
    await saveFabricService(fabric)
    reload()
  }

  async function remove(id: string) {
    await deleteFabricService(id)
    reload()
  }

  return { fabrics, reload, getById, getFiltered, save, remove }
})
