'use client'

import { useEffect, useState } from 'react'
import { EditorExposeRef, EditorTextItem } from '../../_image-editor/types'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'

export default function ThumbnailEditorToolbar({
  controllerRef,
  disabled,
  handleSaveEdited,
}: {
  controllerRef: React.RefObject<EditorExposeRef>
  disabled: boolean
  handleSaveEdited: () => void
}) {
  const [fontSize, setFontSize] = useState<number>(24)
  const [color, setColor] = useState<string>('#111111')
  const [fontStyle, setFontStyle] = useState<'normal' | 'bold' | 'italic' | 'bold italic'>('normal')
  const [rotation, setRotation] = useState<number>(0)
  const [textContent, setTextContent] = useState<string>('')

  useEffect(() => {
    let unsub: (() => void) | null = null
    let cancelled = false

    const trySubscribe = () => {
      const editor = controllerRef.current
      if (editor && !cancelled) {
        unsub = editor.subscribeSelection((text: EditorTextItem | null) => {
          if (!text) return
          setFontSize(text.fontSize)
          setColor(text.color)
          setRotation(text.rotation)
          setTextContent(text.text)
          setFontStyle(text.fontStyle)
        })
      } else if (!cancelled) {
        setTimeout(trySubscribe, 50)
      }
    }

    trySubscribe()
    return () => {
      cancelled = true
      if (unsub) unsub()
    }
  }, [controllerRef])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => controllerRef.current?.addText()}>
          텍스트 추가
        </Button>
        <Button size="sm" variant="outline" onClick={() => controllerRef.current?.deleteSelected()}>
          텍스트 삭제
        </Button>
      </div>
      <div className="bg-muted mx-2 h-5 w-px" />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="폰트 크기"
          className="h-8 w-24"
          value={fontSize}
          onChange={e => {
            const v = Number(e.target.value) || 0
            setFontSize(v)
            controllerRef.current?.updateSelectedTextStyle({ fontSize: v })
          }}
        />
        <Input
          type="color"
          className="h-8 w-10 p-0"
          value={color}
          onChange={e => {
            const v = e.target.value
            setColor(v)
            controllerRef.current?.updateSelectedTextStyle({ color: v })
          }}
        />
        <Button
          size="sm"
          variant={fontStyle.includes('bold') ? 'default' : 'outline'}
          onClick={() => {
            const next = (
              fontStyle.includes('bold') ? fontStyle.replace('bold', '').trim() : (fontStyle + ' bold').trim()
            ) as any
            setFontStyle(next)
            controllerRef.current?.updateSelectedTextStyle({ fontStyle: next })
          }}>
          B
        </Button>
        <Button
          size="sm"
          variant={fontStyle.includes('italic') ? 'default' : 'outline'}
          onClick={() => {
            const next = (
              fontStyle.includes('italic') ? fontStyle.replace('italic', '').trim() : (fontStyle + ' italic').trim()
            ) as any
            setFontStyle(next)
            controllerRef.current?.updateSelectedTextStyle({ fontStyle: next })
          }}>
          I
        </Button>
        <Input
          type="number"
          placeholder="회전"
          className="h-8 w-24"
          value={rotation}
          onChange={e => {
            const v = Number(e.target.value) || 0
            setRotation(v)
            controllerRef.current?.updateSelectedTextStyle({ rotation: v })
          }}
        />
      </div>
      <div className="bg-muted mx-2 h-5 w-px" />
      <div className="flex items-center gap-2">
        <textarea
          placeholder="텍스트 내용"
          className="border-input bg-background h-12 w-80 resize-none rounded-md border p-2 text-sm leading-5 outline-none"
          value={textContent}
          onChange={e => {
            const v = e.target.value
            setTextContent(v)
            controllerRef.current?.updateSelectedTextContent(v)
          }}
        />
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => controllerRef.current?.undo()}>
            실행취소
          </Button>
          <Button size="sm" variant="outline" onClick={() => controllerRef.current?.redo()}>
            다시실행
          </Button>
        </div>
        <Button size="sm" variant="outline" disabled={disabled} onClick={handleSaveEdited} className="w-24">
          저장
        </Button>
      </div>
    </div>
  )
}
