import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initializeStore } from '../services/storageService'
import { useFabricStore } from './fabricStore'
import { useProjectStore } from './projectStore'

export const useAppStore = defineStore('app', () => {
  const initialized = ref(false)
  const loading = ref(true)
  const initError = ref<string | null>(null)

  async function initialize() {
    loading.value = true
    initError.value = null
    try {
      await initializeStore()
      const fabricStore = useFabricStore()
      const projectStore = useProjectStore()
      fabricStore.reload()
      projectStore.reload()
      initialized.value = true
    } catch (e: any) {
      initError.value = e?.message || '无法连接到云服务'
    } finally {
      loading.value = false
    }
  }

  return { initialized, loading, initError, initialize }
})
