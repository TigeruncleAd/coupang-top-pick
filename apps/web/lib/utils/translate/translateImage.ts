'use server'
import { successServerAction, throwServerAction } from '@repo/utils'
import { AnalyzeImageResult } from '@/types/analyze/editor'
import { analyzeImageGoogleCloudVision } from './googleCloudVision'
import { cjkRegex } from '@/lib/utils/regex'
import { createMask } from './createMask'
import { inpaintImage } from './inpaintImage'
import { translateTextbox } from './translateTextbox'

export type AnalyzeImageInput = {
  images: Array<{
    mimeType: string
    dataBase64: string // base64 without data URL prefix
    id: string
  }>
}

export async function translateImage(data: AnalyzeImageInput): Promise<{ results: AnalyzeImageResult[] }> {
  const startTime = Date.now()
  const results: AnalyzeImageResult[] = await Promise.all(
    data.images.map(async (image, idx) => {
      try {
        const { shapeTexts, width, height } = await analyzeImageGoogleCloudVision({
          id: image.id,
          dataBase64: image.dataBase64,
        })
        console.log(`analyzeImageGoogleCloudVision ${idx} took ${Date.now() - startTime}ms`)

        const cjkShapeTexts = shapeTexts.filter(s => cjkRegex.test(s.text))

        if (cjkShapeTexts.length === 0) {
          return {
            imageId: image.id,
            status: 'success',
            width: width,
            height: height,
          }
        }
        const { maskImageBuffer, textToTranslate } = await createMask({
          imageId: image.id,
          width: width,
          height: height,
          cjkShapeTexts,
        })
        console.log(`createMask ${idx} took ${Date.now() - startTime}ms`)

        const inpaintedImageUrl = await inpaintImage(
          { data: Buffer.from(image.dataBase64, 'base64'), id: image.id },
          { data: maskImageBuffer, id: `${image.id}-mask` },
        )
        console.log(`inpaintImage ${idx} took ${Date.now() - startTime}ms`)

        const translatedTextBoxes = await translateTextbox({ textToTranslate, image })
        console.log(`translateTextbox ${idx} took ${Date.now() - startTime}ms`)

        const result2: AnalyzeImageResult = {
          imageId: image.id,
          status: 'success',
          width: width,
          height: height,
          boxes: textToTranslate.map((m, idx) => {
            const id = `${image.id}-${idx}`
            const target = translatedTextBoxes.find((b: any) => b.id === id)
            const color = target?.color
            return {
              id,
              bbox: m.bbox,
              original: m.original,
              translated: target?.translated || m.original,
              color: color || m.color,
              fontSize: m.fontSize,
            }
          }),
          inpaintedImageUrl,
        }

        return result2
      } catch (e) {
        console.error(e)
        return {
          imageId: image.id,
          status: 'failed',
        }
      }
    }),
  )
  const endTime = Date.now()
  console.log(`translateImage took ${endTime - startTime}ms`)

  return { results }
}
