type DrawCtx = {
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
  arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean): void
  closePath(): void
}

/** Parse and draw a simple SVG path (M, L, Q, C, Z) into a canvas 2D context. */
export function drawSvgPath(ctx: DrawCtx, pathData: string, scaleX = 1, scaleY = 1) {
  const tokens = pathData.match(/[MLQCZmlqcz]|[-\d.]+(?:e[-+]?\d+)?/g) || []
  let i = 0
  const sx = (n: number) => n * scaleX
  const sy = (n: number) => n * scaleY
  ctx.beginPath()

  while (i < tokens.length) {
    const cmd = tokens[i++]
    switch (cmd) {
      case 'M': ctx.moveTo(sx(+tokens[i++]), sy(+tokens[i++])); break
      case 'm': { const dx = sx(+tokens[i++]); const dy = sy(+tokens[i++]); ctx.moveTo(dx, dy); break }
      case 'L': ctx.lineTo(sx(+tokens[i++]), sy(+tokens[i++])); break
      case 'l': { const dx = sx(+tokens[i++]); const dy = sy(+tokens[i++]); ctx.lineTo(dx, dy); break }
      case 'Q':
        ctx.quadraticCurveTo(sx(+tokens[i++]), sy(+tokens[i++]), sx(+tokens[i++]), sy(+tokens[i++]))
        break
      case 'C':
        ctx.bezierCurveTo(sx(+tokens[i++]), sy(+tokens[i++]), sx(+tokens[i++]), sy(+tokens[i++]), sx(+tokens[i++]), sy(+tokens[i++]))
        break
      case 'Z':
      case 'z':
        ctx.closePath()
        break
      default:
        break
    }
  }
}
