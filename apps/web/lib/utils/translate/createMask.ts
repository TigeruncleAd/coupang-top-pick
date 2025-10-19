import { AnalyzedTextBox } from '@/types/analyze/editor'
import sharp from 'sharp'
import { AnalyzedTextShape } from './googleCloudVision'
const INVERT = false
const PADDING = 8

export async function createMask({
  imageId,
  width,
  height,
  cjkShapeTexts,
}: {
  imageId: string
  width: number
  height: number
  cjkShapeTexts: AnalyzedTextShape[]
}) {
  const bg = INVERT ? '#fff' : '#000'
  const fg = INVERT ? '#000' : '#fff'

  const svgParts = []
  svgParts.push(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${bg}"/>`,
  )
  const textToTranslate: AnalyzedTextBox[] = []
  for (const [idx, s] of cjkShapeTexts.entries()) {
    const angle = computePolygonAngleDegrees(s.poly)
    // Use expanded rect (bounding box) if padding is requested
    const { x, y, w, h } = polygonToRect(s.poly)
    const rx = clamp(x - PADDING, 0, width)
    const ry = clamp(y - PADDING, 0, height)
    const rw = clamp(w + PADDING * 2, 0, width - rx)
    const rh = clamp(h + PADDING * 2, 0, height - ry)
    textToTranslate.push({
      id: `${imageId}-${idx}`,
      original: s.text,
      bbox: {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        angle,
      },
      translated: '',
      color: '#333333',
      fontSize: Math.round(rh * 0.8),
    })
    svgParts.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fg}"/>`)
  }
  svgParts.push('</svg>')
  const svg = svgParts.join('\n')
  const maskImageBuffer = await sharp(Buffer.from(svg, 'utf-8'))
    .resize(width, height, { fit: 'fill' })
    .jpeg()
    .toBuffer()
  return { maskImageBuffer, textToTranslate }
}

function polygonToRect(poly: any) {
  const xs = poly.map((p: any) => p.x)
  const ys = poly.map((p: any) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function computePolygonAngleDegrees(poly: any) {
  if (!poly || poly.length < 2) return 0
  const points = poly
  const edges = [
    [points[0], points[1]],
    [points[1], points[2]],
    [points[2], points[3]],
    [points[3], points[0]],
  ]
  let maxLen = -1
  let angleDeg = 0
  for (const [a, b] of edges as any[]) {
    const dx = (b?.x ?? 0) - (a?.x ?? 0)
    const dy = (b?.y ?? 0) - (a?.y ?? 0)
    const len = Math.hypot(dx, dy)
    if (len > maxLen) {
      maxLen = len
      angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    }
  }
  if (angleDeg < 10 && angleDeg > -10) return 0

  return angleDeg
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
