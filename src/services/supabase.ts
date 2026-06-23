import { createClient } from '@supabase/supabase-js'
import { ensureUrlPolyfill } from '../polyfills'

// supabase 在本模块所在的上下文（小程序里是 WASubContext）求值，
// 必须在同一上下文、createClient 之前把 URL 装好，否则 new URL 仍会抛 malformed。
ensureUrlPolyfill()

function normalizeSupabaseUrl(value: unknown): string {
  const url = String(value ?? '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\/[^/\s]+(?:\/[^\s]*)?$/i.test(url)) {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTP or HTTPS URL.')
  }
  return url
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// #ifdef MP-WEIXIN
// 小程序运行环境没有全局 WebSocket，supabase-js 构造 RealtimeClient 时会调用
// WebSocketFactory.getWebSocketConstructor() 并抛
// "Unknown JavaScript runtime without WebSocket support"。本项目不使用 Realtime，
// 给 realtime.transport 传一个占位构造器即可让工厂不被调用；它永远不会被实例化。
class NoopWebSocket {
  constructor() {
    throw new Error('Realtime/WebSocket is not supported in this mini-program build.')
  }
}

function wxFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const method = (options.method || 'GET').toUpperCase() as any
    let header = options.headers as Record<string, string> | undefined
    if (header instanceof Headers) {
      const h: Record<string, string> = {}
      header.forEach((v, k) => { h[k] = v })
      header = h
    }

    uni.request({
      url,
      method,
      header,
      data: options.body as any,
      success(res) {
        const ok = res.statusCode >= 200 && res.statusCode < 300
        resolve({
          ok,
          status: res.statusCode,
          statusText: String(res.statusCode),
          json: () => Promise.resolve(res.data),
          text: () => Promise.resolve(typeof res.data === 'string' ? res.data : JSON.stringify(res.data)),
          headers: new Headers(res.header as Record<string, string>),
        } as unknown as Response)
      },
      fail(err) {
        reject(new Error(err.errMsg))
      },
    })
  })
}
// #endif

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // #ifdef MP-WEIXIN
  global: { fetch: wxFetch as any },
  realtime: { transport: NoopWebSocket as any },
  // #endif
  auth: {
    persistSession: false,
  },
})

export { supabaseUrl, supabaseAnonKey }
