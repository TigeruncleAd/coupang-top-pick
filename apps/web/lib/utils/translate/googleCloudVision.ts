'use server'
import vision from '@google-cloud/vision'

const client = new vision.ImageAnnotatorClient({
  apiKey: process.env.GOOGLE_API_KEY!,
})
const LEVEL = 'paragraph'

export type AnalyzedTextShape = {
  type: string
  poly: any
  text: string
}

export async function analyzeImageGoogleCloudVision({
  id,
  dataBase64,
}: {
  id: string
  dataBase64: string
}): Promise<{ width: number; height: number; shapeTexts: AnalyzedTextShape[] }> {
  const shapeTexts: { type: string; poly: any; text: string }[] = []
  const [result] = await client.textDetection({
    image: { content: dataBase64 },
  })
  const pages = result.fullTextAnnotation?.pages || []
  for (const page of pages) {
    for (const block of page.blocks || []) {
      //   const poly = bboxToPolygon(block.boundingBox)
      //   if (poly) {
      //     shapes.push({ type: 'poly', poly, text: '' })
      //   }
      for (const para of block.paragraphs || []) {
        if (LEVEL === 'paragraph') {
          const poly = bboxToPolygon(para.boundingBox)
          const text = para.words?.map(w => w.symbols?.map(s => s.text || '').join('') || '').join('')
          if (poly) shapeTexts.push({ type: 'poly', poly, text: text || '' })
        }
      }
    }
  }
  return {
    width: result.fullTextAnnotation?.pages?.[0]?.width || 0,
    height: result.fullTextAnnotation?.pages?.[0]?.height || 0,
    shapeTexts,
  }
}

function bboxToPolygon(bbox: any) {
  if (!bbox?.vertices || bbox.vertices.length === 0) return null
  // Vision vertices may be 4 points (possibly rotated). Some fields may be undefined.
  const verts = bbox.vertices.map((v: any) => ({
    x: v.x ?? 0,
    y: v.y ?? 0,
  }))
  // Ensure 4 points (Vision sometimes has normalizedVertices / or fewer; this defends lightly)
  while (verts.length < 4) verts.push({ x: 0, y: 0 })
  return verts.slice(0, 4)
}
