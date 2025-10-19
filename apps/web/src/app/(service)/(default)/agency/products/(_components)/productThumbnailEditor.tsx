'use client'

import { useState } from 'react'
import { EditProduct } from '../serverAction'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Button } from '@repo/ui/components/button'
import { imageResizer } from '@repo/utils'
import { toast } from 'sonner'
import { translateImage } from '@/lib/utils/translate/translateImage'
import { AnalyzedTextBox } from '@/types/analyze/editor'
import ThumbnailEditor from '../_image-editor/components/ThumbnailEditorCanvas'
import { useCallback, useRef, useEffect } from 'react'
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
}

export default function ProductThumbnailEditor({
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
  const thumbnails = (form.selectedTaobaoProduct.myData as any).thumbnails as Thumbnail[]

  function handleSelectThumbnail(thumbnail: Thumbnail) {
    if (selectedThumbnails.find(t => t.id === thumbnail.id)) {
      setSelectedThumbnails(selectedThumbnails.filter(t => t.id !== thumbnail.id))
    } else {
      setSelectedThumbnails([...selectedThumbnails, thumbnail])
    }
  }

  function handleSelectAll() {
    if (selectedThumbnails.length >= thumbnails.length) {
      setSelectedThumbnails([])
    } else {
      setSelectedThumbnails(thumbnails)
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

    const newThumbnails = [...thumbnails]
    for (const result of results) {
      if (result.status === 'success') {
        const target = newThumbnails.find(t => t.id === result.imageId)
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
    const newForm = handleChange({ name: 'selectedTaobaoProduct.myData.thumbnails', value: newThumbnails })
    handleSave(newForm)
    setSelectedThumbnails([])
    toast.success(`${successCount}/${totalCount}개 이미지 번역 완료. ${failCount > 0 ? `${failCount}개 실패` : ''}`)
  }

  const resetSelectedThumbnails = async () => {
    if (selectedThumbnails.length === 0) return
    const confirmed = confirm('선택한 이미지를 초기화하시겠습니까? \n 번역을 포함한 모든 작업내용이 초기화됩니다.')
    if (!confirmed) return
    const selectedIds = new Set(selectedThumbnails.map(s => s.id))
    const reset = (thumbnails || []).map(img =>
      selectedIds.has(img.id)
        ? { ...img, boxes: undefined, translatedUrl: undefined, inpaintedImageUrl: undefined }
        : img,
    )
    handleChange({ name: 'selectedTaobaoProduct.myData.thumbnails', value: reset })
    if (selectedThumbnailToEdit && selectedIds.has(selectedThumbnailToEdit.id)) {
      const updated = reset.find(i => i.id === selectedThumbnailToEdit.id) || null
      if (updated) setSelectedThumbnailToEdit(updated)
      editorRef.current?.reset()
      editorRef.current?.markSaved()
    }
    toast.success(`선택한 ${selectedThumbnails.length}개 이미지를 원래대로 복구했습니다.`)
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

  const handleSaveEdited = useCallback(async () => {
    if (!selectedThumbnailToEdit) return
    const dataUrl = editorRef.current?.exportImage()
    if (!dataUrl) return
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `${selectedThumbnailToEdit.id}.png`, { type: 'image/png' })
    const { public_url } = await uploadS3PreSigned(file, ['images', 'thumbnails'], false)
    const boxes = editorRef.current?.getBoxes() || []
    const newThumbnails = (thumbnails || []).map(t =>
      t.id === selectedThumbnailToEdit.id ? { ...t, translatedUrl: public_url, boxes } : t,
    )
    const newForm = handleChange({ name: 'selectedTaobaoProduct.myData.thumbnails', value: newThumbnails })
    const updated = newThumbnails.find(t => t.id === selectedThumbnailToEdit.id) || null
    if (updated) setSelectedThumbnailToEdit(updated)
    editorRef.current?.markSaved()
    handleSave(newForm)
  }, [selectedThumbnailToEdit, thumbnails])

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
  }, [selectedThumbnailToEdit, thumbnails])

  return (
    <div className="flex h-full max-h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={selectedThumbnails.length >= thumbnails.length} onCheckedChange={handleSelectAll} />
          선택 된 썸네일 : ({selectedThumbnails.length}/{thumbnails.length})
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={translateSelectedThumbnails} disabled={selectedThumbnails.length === 0}>
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                번역 중...
              </>
            ) : (
              <>선택된 이미지 번역 ({selectedThumbnails.length}개)</>
            )}
          </Button>
          <Button variant="outline" onClick={resetSelectedThumbnails} disabled={selectedThumbnails.length === 0}>
            선택된 이미지 초기화
          </Button>
        </div>
      </div>
      <div className="grid h-full max-h-full flex-1 grid-cols-[200px_1fr] gap-4 overflow-hidden">
        {/* 썸네일 목록 */}
        <div className="flex h-full max-h-full w-full flex-col gap-4 overflow-y-auto">
          {thumbnails.map((thumbnail, idx) => {
            const isTranslated = thumbnail.boxes
            const isSaved = thumbnail.translatedUrl
            const needSave = isTranslated && !isSaved
            return (
              <div key={idx} className={`relative h-[200px] w-full ${needSave ? 'border-2 border-red-500' : ''}`}>
                <img
                  src={thumbnail.translatedUrl || thumbnail.url}
                  alt={`thumbnail_${idx}`}
                  className="h-full w-full object-cover"
                  onClick={() => handleGuardedSelectToEdit(thumbnail)}
                />
                <Checkbox
                  checked={!!selectedThumbnails.find(t => t.id === thumbnail.id)}
                  onCheckedChange={() => handleSelectThumbnail(thumbnail)}
                  className="absolute left-2 top-2"
                />
                {needSave && <Badge className="absolute right-2 top-2 text-red-500">저장 필요</Badge>}
              </div>
            )
          })}
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
