interface Point { x: number; y: number }

function fmt(n: number) { return Math.round(n * 10) / 10 }

export function roundedPolygonPath(pts: Point[], r: number): string {
  if (r <= 0) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p.x)} ${fmt(p.y)}`).join(' ') + ' Z'
  }
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const curr = pts[i]
    const next = pts[(i + 1) % n]
    const dx1 = prev.x - curr.x, dy1 = prev.y - curr.y
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y
    const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
    const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
    const cr = Math.min(r, l1 / 2, l2 / 2)
    const t1 = { x: curr.x + (dx1 / l1) * cr, y: curr.y + (dy1 / l1) * cr }
    const t2 = { x: curr.x + (dx2 / l2) * cr, y: curr.y + (dy2 / l2) * cr }
    if (i === 0) d += `M ${fmt(t1.x)} ${fmt(t1.y)}`
    else d += ` L ${fmt(t1.x)} ${fmt(t1.y)}`
    d += ` Q ${fmt(curr.x)} ${fmt(curr.y)} ${fmt(t2.x)} ${fmt(t2.y)}`
  }
  return d + ' Z'
}
