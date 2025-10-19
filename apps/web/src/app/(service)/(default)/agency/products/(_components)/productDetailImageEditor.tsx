'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { EditProduct } from '../serverAction'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Button } from '@repo/ui/components/button'
import { imageResizer } from '@repo/utils'
import { toast } from 'sonner'
import { translateImage } from '@/lib/utils/translate/translateImage'
import { AnalyzedTextBox } from '@/types/analyze/editor'
import ThumbnailEditor from '../_image-editor/components/ThumbnailEditorCanvas'
import { uploadS3PreSigned } from '@repo/utils'
import ThumbnailEditorToolbar from '../_image-editor/components/ThumbnailEditorToolbar'
import { EditorExposeRef } from '../_image-editor/types'
import { Badge } from '@repo/ui/components/badge'
import { Loader2 } from 'lucide-react'

export type Thumbnail = {
  id: string
  url: string
  inpaintedImageUrl?: string
  width?: number
  height?: number
  boxes?: AnalyzedTextBox[]
  translatedUrl?: string
  // detail 이미지 전용 메타데이터
  index?: number
}

export default function ProductDetailImageEditor({
  form,
  handleChange,
  handleSave,
}: {
  form: EditProduct
  handleChange: ({ name, value }: { name: string; value: any }) => EditProduct
  handleSave: (form: EditProduct) => void
}) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedThumbnails, setSelectedThumbnails] = useState<Thumbnail[]>([])
  const [selectedThumbnailToEdit, setSelectedThumbnailToEdit] = useState<Thumbnail | null>(null)
  const editorRef = useRef<EditorExposeRef>(null)
  const [canSave, setCanSave] = useState(false)
  const detail = (form.selectedTaobaoProduct.myData as any).detail as string
  const detailImages = ((form.selectedTaobaoProduct.myData as any).detailImages || []) as Thumbnail[]
  // HTML에서 img 목록을 파싱하여 Thumbnail 형태로 생성
  function parseDetailImagesFromHtml(html: string): Thumbnail[] {
    try {
      const productId = form.id.toString()
      const selectedTaobaoProductId = form.selectedTaobaoProduct.id.toString()
      const doc = new DOMParser().parseFromString(html || '', 'text/html')
      const images = Array.from(doc.querySelectorAll('img'))
      const result: Thumbnail[] = images.map((img, idx) => ({
        id: `${productId}-${selectedTaobaoProductId}-${idx.toString()}`,
        url: img.src,
        index: idx,
      }))
      return result
    } catch (e) {
      return []
    }
  }

  // detailImages를 보정/초기화: myData.detailImages가 없거나 HTML과 불일치하면 재생성
  useEffect(() => {
    const parsed = parseDetailImagesFromHtml(detail)
    const needInitialize = !detailImages?.length
    const urlsInMyData = (detailImages || []).map(i => i.translatedUrl || i.url)
    const urlsInParsed = parsed.map(p => p.url)
    const mismatch = urlsInMyData.length !== urlsInParsed.length || urlsInMyData.some((u, i) => u !== urlsInParsed[i])

    if (needInitialize || mismatch) {
      const initialized = parsed
      handleChange({ name: 'selectedTaobaoProduct.myData.detailImages', value: initialized })
      // 선택 상태/편집 상태 초기화
      setSelectedThumbnails([])
      setSelectedThumbnailToEdit(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail])

  // 저장 가능 조건: (1) 에디터에 수정사항이 있는 경우, (2) 번역 결과가 있으나 저장되지 않은 경우
  useEffect(() => {
    let interval: any
    const update = () => {
      const dirty = editorRef.current?.isDirty?.() || false
      const needSave = !!(
        selectedThumbnailToEdit &&
        selectedThumbnailToEdit.boxes &&
        !selectedThumbnailToEdit.translatedUrl
      )
      setCanSave(!!selectedThumbnailToEdit && (dirty || needSave))
    }
    update()
    interval = setInterval(update, 300)
    return () => clearInterval(interval)
  }, [selectedThumbnailToEdit, detailImages])

  function handleSelectThumbnail(thumbnail: Thumbnail) {
    if (selectedThumbnails.find(t => t.id === thumbnail.id)) {
      setSelectedThumbnails(selectedThumbnails.filter(t => t.id !== thumbnail.id))
    } else {
      setSelectedThumbnails([...selectedThumbnails, thumbnail])
    }
  }

  function handleSelectAll() {
    if (selectedThumbnails.length >= detailImages.length) {
      setSelectedThumbnails([])
    } else {
      setSelectedThumbnails(detailImages)
    }
  }

  async function translateSelectedThumbnails() {
    setIsTranslating(true)
    const totalCount = selectedThumbnails.length
    const resizedThumbnails = await Promise.all(
      selectedThumbnails.map(async thumbnail => {
        const res = await fetch(thumbnail.url)
        const blob = await res.blob()
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
        const resizedFile = await imageResizer(file, {
          maxWidth: 1280,
          maxHeight: 9999,
          compressFormat: 'JPEG',
          quality: 100,
        })
        const base64 = await resizedFile.arrayBuffer()
        return {
          id: thumbnail.id,
          dataBase64: Buffer.from(base64).toString('base64'),
          mimeType: 'image/jpeg',
        }
      }),
    )
    const { results } = await translateImage({ images: resizedThumbnails })
    const successCount = results.filter(r => r.status === 'success').length
    const failCount = totalCount - successCount

    const newImages = [...detailImages]
    for (const result of results) {
      if (result.status === 'success') {
        const target = newImages.find(t => t.id === result.imageId)
        if (target) {
          target.width = result.width
          target.height = result.height
          target.boxes = result.boxes
          target.inpaintedImageUrl = result.inpaintedImageUrl
          target.translatedUrl = null
        }
      }
    }

    setIsTranslating(false)
    const newForm = handleChange({ name: 'selectedTaobaoProduct.myData.detailImages', value: newImages })
    handleSave(newForm)
    setSelectedThumbnails([])
    toast.success(`${successCount}/${totalCount}개 이미지 번역 완료. ${failCount > 0 ? `${failCount}개 실패` : ''}`)
  }

  const handleGuardedSelectToEdit = useCallback(
    async (thumb: Thumbnail) => {
      const hasDirty = editorRef.current?.isDirty() || false
      if (selectedThumbnailToEdit && hasDirty) {
        const shouldSave = window.confirm('현재 이미지의 변경사항을 저장할까요? 저장하지 않으면 모두 폐기됩니다.')
        if (shouldSave) {
          await handleSaveEdited()
        } else {
          editorRef.current?.reset()
        }
      }
      setSelectedThumbnailToEdit(thumb)
    },
    [selectedThumbnailToEdit],
  )

  function applyDetailImagesToHtml(html: string, images: Thumbnail[]) {
    try {
      const doc = new DOMParser().parseFromString(html || '', 'text/html')
      const imgElements = Array.from(doc.querySelectorAll('img'))
      images.forEach(imgMeta => {
        const i = typeof imgMeta.index === 'number' ? imgMeta.index : Number(imgMeta.id)
        const el = imgElements[i]
        if (el) {
          const nextSrc = imgMeta.translatedUrl || imgMeta.url
          if (nextSrc) el.src = nextSrc
        }
      })
      return doc.body.innerHTML
    } catch (e) {
      return html
    }
  }

  const handleSaveEdited = useCallback(async () => {
    if (!selectedThumbnailToEdit) return
    const dataUrl = editorRef.current?.exportImage()
    if (!dataUrl) return
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `${selectedThumbnailToEdit.id}.png`, { type: 'image/png' })
    const { public_url } = await uploadS3PreSigned(file, ['images', 'detailImages'], false)
    const boxes = editorRef.current?.getBoxes() || []
    const newImages = (detailImages || []).map(t =>
      t.id === selectedThumbnailToEdit.id ? { ...t, translatedUrl: public_url, boxes } : t,
    )
    const newDetailHtml = applyDetailImagesToHtml(detail, newImages)

    const newMyData = {
      ...(form.selectedTaobaoProduct.myData as any),
      detailImages: newImages,
      detail: newDetailHtml,
    }
    const newForm = handleChange({ name: 'selectedTaobaoProduct.myData', value: newMyData })

    const updated = newImages.find(t => t.id === selectedThumbnailToEdit.id) || null
    if (updated) setSelectedThumbnailToEdit(updated)
    editorRef.current?.markSaved()
    handleSave(newForm)
  }, [selectedThumbnailToEdit, detailImages, detail])

  return (
    <div className="flex h-full max-h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedThumbnails.length >= detailImages.length && detailImages.length > 0}
            onCheckedChange={handleSelectAll}
          />
          상세 이미지 선택 : ({selectedThumbnails.length}/{detailImages.length})
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={translateSelectedThumbnails}
            disabled={detailImages.length === 0 || selectedThumbnails.length === 0}>
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                번역 중...
              </>
            ) : (
              <>선택된 이미지 번역 ({selectedThumbnails.length}개)</>
            )}
          </Button>
        </div>
      </div>
      <div className="grid h-full max-h-full flex-1 grid-cols-[200px_1fr] gap-4 overflow-hidden">
        {/* 상세 이미지 목록 */}
        <div className="flex h-full max-h-full w-full flex-col gap-4 overflow-y-auto">
          {detailImages.map((img, idx) => {
            const isTranslated = img.boxes
            const isSaved = img.translatedUrl
            const needSave = isTranslated && !isSaved
            return (
              <div key={idx} className={`relative h-[200px] w-full ${needSave ? 'border-2 border-red-500' : ''}`}>
                <img
                  src={img.translatedUrl || img.url}
                  alt={`detail_${idx}`}
                  className="h-full w-full object-cover"
                  onClick={() => handleGuardedSelectToEdit(img)}
                />
                <Checkbox
                  checked={!!selectedThumbnails.find(t => t.id === img.id)}
                  onCheckedChange={() => handleSelectThumbnail(img)}
                  className="absolute left-2 top-2"
                />
                {needSave && <Badge className="absolute right-2 top-2 text-red-500">저장 필요</Badge>}
              </div>
            )
          })}
          {detailImages.length === 0 && (
            <div className="text-muted-foreground py-8 text-center text-sm">상세 설명 내 이미지가 없습니다.</div>
          )}
        </div>
        {/* 이미지 에디터 */}
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-2 overflow-hidden">
            <ThumbnailEditorToolbar
              key={selectedThumbnailToEdit?.id || 'none'}
              controllerRef={editorRef}
              disabled={!canSave}
              handleSaveEdited={handleSaveEdited}
            />
            <div className="relative h-full w-full overflow-auto rounded-md border">
              {selectedThumbnailToEdit && (
                <ThumbnailEditor
                  ref={editorRef}
                  key={selectedThumbnailToEdit.id}
                  imageUrl={selectedThumbnailToEdit.inpaintedImageUrl || selectedThumbnailToEdit.url}
                  initialBoxes={selectedThumbnailToEdit.boxes || []}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
