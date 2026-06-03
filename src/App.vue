<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppStore } from './stores/appStore'

onLaunch(async () => {
  const appStore = useAppStore()
  await appStore.initialize()
})
</script>

<style lang="scss">
page {
  background-color: $color-background;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: $color-text-primary;
  font-size: $font-base;
}
</style>
