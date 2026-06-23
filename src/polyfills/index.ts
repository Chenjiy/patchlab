// 微信小程序的 app 主上下文与页面 WASubContext 是相互独立的 JS 执行上下文，
// 全局对象不共享。所以这里导出一个幂等的安装函数，谁用到 URL 就在自己的
// 上下文里调用一次（见 services/supabase.ts），而不是只在 app.js 里装一次。
// #ifdef MP
import URLImpl from 'core-js-pure/web/url'
import URLSearchParamsImpl from 'core-js-pure/web/url-search-params'
import HeadersImpl from './headers'

const impl = (URLImpl as any)?.default ?? URLImpl
const spImpl = (URLSearchParamsImpl as any)?.default ?? URLSearchParamsImpl

function forceInstall(g: Record<string, any>, name: string, value: unknown) {
  if (!value) return
  try {
    g[name] = value
  } catch (_e) {
    /* ignore */
  }
  if (g[name] !== value) {
    try {
      Object.defineProperty(g, name, { value, writable: true, configurable: true })
    } catch (_e) {
      /* ignore */
    }
  }
}

export function ensureUrlPolyfill() {
  const g = globalThis as Record<string, any>
  forceInstall(g, 'URL', impl)
  forceInstall(g, 'URLSearchParams', spImpl)
  forceInstall(g, 'Headers', HeadersImpl)
}

// 在 app 主上下文也装一份（兜底）
ensureUrlPolyfill()
// #endif

// #ifndef MP
export function ensureUrlPolyfill() {
  /* H5 / 其他平台原生支持，无需处理 */
}
// #endif

export {}
