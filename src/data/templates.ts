import type { CanvasTemplate } from '../types'

export const PX_PER_CM = 38
export const CANVAS_PADDING = 80

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'phone-pouch',
    name: '手机袋',
    width: 280,
    height: 400,
    icon: '📱',
    description: '14 × 20 cm',
  },
  {
    id: 'laptop-sleeve',
    name: '电脑包',
    width: 520,
    height: 380,
    icon: '💻',
    description: '26 × 19 cm',
  },
  {
    id: 'coaster',
    name: '杯垫',
    width: 200,
    height: 200,
    icon: '☕',
    description: '10 × 10 cm',
  },
  {
    id: 'tote-bag',
    name: '帆布袋',
    width: 420,
    height: 480,
    icon: '👜',
    description: '21 × 24 cm',
  },
  {
    id: 'dumpling-bag',
    name: '饺子包',
    width: 360,
    height: 420,
    icon: '🥟',
    description: '18 × 21 cm',
    shape: 'trapezoid',
  },
  {
    id: 'custom',
    name: '自定义',
    width: 360,
    height: 360,
    icon: '✂️',
    description: '自选尺寸',
  },
]
