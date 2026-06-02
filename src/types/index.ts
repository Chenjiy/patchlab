export interface FabricTexture {
  id: string
  name: string
  originalImage: string
  processedImage: string
  material: 'cotton' | 'linen' | 'denim' | 'lace' | 'canvas' | 'velvet' | 'wool' | 'silk' | 'suede' | 'felt' | 'knit' | 'leather' | 'other'
  patternType: 'solid' | 'floral' | 'check' | 'stripe' | 'dot' | 'animal' | 'other'
  mainColors: string[]
  sizeNote: string
  useCases: string[]
  tags: string[]
  createdAt: string
}

export interface MaskShape {
  id: string
  name: string
  category: string
  type: 'circle' | 'rect' | 'svg' | 'custom'
  svgPath?: string
  defaultWidth: number
  defaultHeight: number
  rawPoints?: number[]
}

export interface PatchLayer {
  id: string
  maskShapeId: string
  fabricTextureId: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  textureScale: number
  textureOffsetX: number
  textureOffsetY: number
  textureRotation: number
  colorSaturation?: number
  colorBrightness?: number
  edgeStyle: 'none' | 'topstitch' | 'double-topstitch' | 'saddle-stitch' | 'overlock'
  edgeColor?: string
  stitchSpacing?: number
  zIndex: number
}

export type TemplateType = 'phone-pouch' | 'laptop-sleeve' | 'coaster' | 'tote-bag' | 'dumpling-bag' | 'custom'

export interface DesignProject {
  id: string
  name: string
  templateType: TemplateType
  baseFabricId: string
  canvasWidth: number
  canvasHeight: number
  baseFabricScale: number
  baseFabricOffsetX: number
  baseFabricOffsetY: number
  baseFabricSaturation?: number
  baseFabricBrightness?: number
  // Custom template shape parameters (cm / mm)
  customTopCm?: number
  customBottomCm?: number
  customHeightCm?: number
  customCornerMm?: number
  patchLayers: PatchLayer[]
  accessories: Accessory[]
  previewImage?: string
  createdAt: string
  updatedAt: string
}

export interface CanvasTemplate {
  id: TemplateType
  name: string
  width: number
  height: number
  icon: string
  description: string
  shape?: 'rect' | 'trapezoid'
}

export type AccessoryType = 'zipper' | 'webbing' | 'loop-tab' | 'flap' | 'snap-button' | 'strap' | 'handle' | 'd-ring' | 'buckle'

export interface Accessory {
  id: string
  type: AccessoryType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string
  fabricTextureId?: string
  fabricScale?: number
  fabricSaturation?: number
  fabricBrightness?: number
  cornerRadius?: number
  zIndex: number
}

export interface CustomTemplate {
  id: string
  name: string
  topCm: number
  bottomCm: number
  heightCm: number
  cornerMm: number
}

export type MaterialLabel = FabricTexture['material']
export type PatternLabel = FabricTexture['patternType']
