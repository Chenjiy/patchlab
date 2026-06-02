import type { RefObject } from 'react'

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function withTransformersHidden<T>(stage: any, fn: () => T): T {
  const transformers = stage.find('Transformer') as any[]
  transformers.forEach((tr) => tr.visible(false))
  stage.batchDraw()
  try {
    return fn()
  } finally {
    transformers.forEach((tr) => tr.visible(true))
    stage.batchDraw()
  }
}

interface CropConfig {
  x: number
  y: number
  width: number
  height: number
}

export async function exportCanvasAsPng(
  stageRef: RefObject<any>,
  filename = 'patchlab-design.png',
  crop?: CropConfig
): Promise<void> {
  const stage = stageRef.current
  if (!stage) return

  const dataUrl = withTransformersHidden(stage, () =>
    stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png', ...crop })
  )
  downloadDataUrl(dataUrl, filename)
}

export async function captureCanvasPreview(stageRef: RefObject<any>, crop?: CropConfig): Promise<string> {
  const stage = stageRef.current
  if (!stage) return ''

  return withTransformersHidden(stage, () =>
    stage.toDataURL({ pixelRatio: 0.5, ...crop })
  )
}
