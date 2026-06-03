import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// #ifdef MP-WEIXIN
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
  // #endif
  auth: {
    persistSession: false,
  },
})

export { supabaseUrl, supabaseAnonKey }
