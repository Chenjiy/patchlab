// 浏览器与微信小程序的 Canvas 运行环境差异封装。
// H5 用 window / DOM canvas / new Image()；小程序没有这些全局，
// 必须用 canvas 节点提供的 requestAnimationFrame / createImage 和离屏 canvas。

// 小程序里 createImage / requestAnimationFrame 都挂在具体的 canvas 节点上，
// 引擎初始化时把节点存进来，供各 Node 在需要时取用。
let activeCanvas: any = null

export function setPlatformCanvas(canvas: any) {
  activeCanvas = canvas
}

export function getDevicePixelRatio(): number {
  // #ifdef H5
  return (typeof window !== 'undefined' && window.devicePixelRatio) || 1
  // #endif
  // #ifndef H5
  try {
    const info = (uni as any).getWindowInfo ? (uni as any).getWindowInfo() : uni.getSystemInfoSync()
    return info.pixelRatio || 1
  } catch (_e) {
    return 1
  }
  // #endif
}

export function requestFrame(cb: () => void): number {
  // #ifdef H5
  return requestAnimationFrame(cb)
  // #endif
  // #ifndef H5
  if (activeCanvas && typeof activeCanvas.requestAnimationFrame === 'function') {
    return activeCanvas.requestAnimationFrame(cb)
  }
  return setTimeout(cb, 16) as unknown as number
  // #endif
}

export function cancelFrame(id: number) {
  // #ifdef H5
  cancelAnimationFrame(id)
  // #endif
  // #ifndef H5
  if (activeCanvas && typeof activeCanvas.cancelAnimationFrame === 'function') {
    activeCanvas.cancelAnimationFrame(id)
  } else {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
  }
  // #endif
}

// 离屏 canvas：H5 用 DOM，小程序用 wx.createOffscreenCanvas（type:'2d'）。
export function createOffscreenCanvas(width: number, height: number): any {
  // #ifdef H5
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
  // #endif
  // #ifndef H5
  return (wx as any).createOffscreenCanvas({ type: '2d', width, height })
  // #endif
}

// 图片：H5 用 new Image()，小程序必须用 canvas 节点的 createImage()。
export function createPlatformImage(): any {
  // #ifdef H5
  return new Image()
  // #endif
  // #ifndef H5
  if (activeCanvas && typeof activeCanvas.createImage === 'function') {
    return activeCanvas.createImage()
  }
  const off = (wx as any).createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
  return off.createImage()
  // #endif
}

// 只有 H5 的 DOM canvas 有 style；小程序的 canvas 节点没有，写它会报错。
export function applyCanvasDisplaySize(canvas: any, width: number, height: number) {
  // #ifdef H5
  if (canvas && canvas.style) {
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
  }
  // #endif
}
