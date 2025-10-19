'use client'

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva'
import Konva from 'konva'
import useImage from 'use-image'
import { nanoid } from 'nanoid'
import { AnalyzedTextBox } from '@/types/analyze/editor'
import { EditorExposeRef, EditorTextItem } from '../../_image-editor/types'
import { useEditorHistory } from '../../_image-editor/hooks/useEditorHistory'

const MEASURE_FONT_FAMILY = 'Calibri'
let measureCtx: CanvasRenderingContext2D | null = null
function ensureMeasureCtx() {
  if (typeof document === 'undefined') return null
  if (measureCtx) return measureCtx
  const canvas = document.createElement('canvas')
  measureCtx = canvas.getContext('2d')
  return measureCtx
}
function buildFontString(size: number, fontStyle: string | undefined) {
  const isBold = fontStyle?.includes('bold')
  const isItalic = fontStyle?.includes('italic')
  return `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${size}px ${MEASURE_FONT_FAMILY}`.trim()
}
function measureTextWidth(text: string, size: number, fontStyle?: string) {
  const ctx = ensureMeasureCtx()
  if (!ctx) return text.length * size
  ctx.font = buildFontString(size, fontStyle)
  return ctx.measureText(text).width
}
function fitFontSizeToWidth(text: string, maxWidth: number, initial: number, fontStyle?: string) {
  let size = Math.max(8, Math.floor(initial))
  let width = measureTextWidth(text, size, fontStyle)
  while (width > maxWidth && size > 8) {
    size -= 1
    width = measureTextWidth(text, size, fontStyle)
  }
  return size
}

function toEditorTextItem(box: AnalyzedTextBox): EditorTextItem {
  const baseSize = box.fontSize || Math.max(10, Math.round(box.bbox.height * 0.7))
  const fitted = fitFontSizeToWidth(box.translated || box.original, box.bbox.width, baseSize, 'normal')
  return {
    id: box.id,
    x: box.bbox.x,
    y: box.bbox.y,
    width: box.bbox.width,
    height: box.bbox.height,
    text: box.translated || box.original,
    fontSize: fitted,
    color: box.color || '#111111',
    fontStyle: 'normal',
    rotation: box.bbox.angle || 0,
  }
}

export default forwardRef(function ThumbnailEditor(
  {
    imageUrl,
    initialBoxes = [],
  }: {
    imageUrl: string
    initialBoxes?: AnalyzedTextBox[]
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [img] = useImage(imageUrl, 'anonymous')
  const stageRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  const selectionListenersRef = useRef<Array<(text: EditorTextItem | null) => void>>([])
  const textRefs = useRef<Record<string, any>>({})

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const initialState = useMemo(
    () => ({
      texts: initialBoxes.map(toEditorTextItem),
      imageUrl,
    }),
    [imageUrl, initialBoxes],
  )

  const { state, setState, undo, redo, isDirty, markSaved, reset } = useEditorHistory(initialState)

  useEffect(() => {
    reset(initialState)
  }, [imageUrl])

  function emitSelection() {
    const selected = selectedNodeIdRef.current
    const text = state.texts.find(t => t.id === selected) || null
    for (const l of selectionListenersRef.current) l(text)
  }

  function recomputeHeightFor(id: string) {
    requestAnimationFrame(() => {
      const node = textRefs.current[id]
      if (!node) return
      const measured = node.height()
      setState(prev => ({
        ...prev,
        texts: prev.texts.map(t => (t.id === id ? { ...t, height: measured } : t)),
      }))
    })
  }

  useImperativeHandle(
    ref,
    () => ({
      isDirty,
      markSaved,
      reset: () => reset(initialState),
      exportImage: () => {
        if (!stageRef.current || !img) return null

        // Hide selection transformer while exporting (do not restore)
        selectAndAttach(null)
        stageRef.current.draw()

        stageRef.current.scale({ x: 1, y: 1 })
        stageRef.current.width(img.width)
        stageRef.current.height(img.height)
        stageRef.current.draw()

        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 })

        const scale = computeScale()
        stageRef.current.scale({ x: scale, y: scale })
        stageRef.current.width(img.width * scale)
        stageRef.current.height(img.height * scale)
        stageRef.current.draw()

        return dataUrl
      },
      undo,
      redo,
      addText: preset => {
        setState(prev => ({
          ...prev,
          texts: [
            ...prev.texts,
            {
              id: nanoid(),
              x: 50,
              y: 50,
              width: 200,
              height: 60,
              text: '텍스트',
              fontSize: 24,
              color: '#111111',
              fontStyle: 'normal',
              rotation: 0,
              ...preset,
            },
          ],
        }))
      },
      deleteSelected: () => {
        const id = selectedNodeIdRef.current
        if (!id) return
        setState(prev => ({
          ...prev,
          texts: prev.texts.filter(t => t.id !== id),
        }))
        selectedNodeIdRef.current = null
        emitSelection()
      },
      updateSelectedTextStyle: preset => {
        const id = selectedNodeIdRef.current
        if (!id) return
        setState(prev => ({
          ...prev,
          texts: prev.texts.map(t => (t.id === id ? { ...t, ...preset } : t)),
        }))
        if ('fontSize' in preset || 'width' in preset) recomputeHeightFor(id)
      },
      updateSelectedTextContent: text => {
        const id = selectedNodeIdRef.current
        if (!id) return
        setState(prev => ({
          ...prev,
          texts: prev.texts.map(t => (t.id === id ? { ...t, text } : t)),
        }))
        recomputeHeightFor(id)
      },
      getSelectedText: () => {
        const id = selectedNodeIdRef.current
        if (!id) return null
        return state.texts.find(t => t.id === id) || null
      },
      subscribeSelection: listener => {
        selectionListenersRef.current.push(listener)
        return () => {
          selectionListenersRef.current = selectionListenersRef.current.filter(l => l !== listener)
        }
      },
      getBoxes: () =>
        state.texts.map<AnalyzedTextBox>(t => ({
          id: t.id,
          bbox: { x: t.x, y: t.y, width: t.width, height: t.height, angle: t.rotation },
          original: t.text,
          translated: t.text,
          fontSize: t.fontSize,
          color: t.color,
        })),
    }),
    [initialState, isDirty, markSaved, reset, setState, state.texts, undo, redo, img, containerWidth],
  )

  const selectAndAttach = (id: string | null) => {
    selectedNodeIdRef.current = id
    if (!transformerRef.current) return
    const stage = stageRef.current
    if (!id) {
      transformerRef.current.nodes([])
      emitSelection()
      return
    }
    const node = stage.findOne(`#${id}`)
    if (node) {
      transformerRef.current.nodes([node])
      transformerRef.current.getLayer()?.batchDraw()
    }
    emitSelection()
  }

  const computeScale = () => {
    if (!img) return 1
    if (!containerWidth) return 1
    const scale = containerWidth / img.width
    return scale < 1 ? scale : 1
  }

  const scale = computeScale()
  const stageWidth = img ? img.width * scale : 0
  const stageHeight = img ? img.height * scale : 0

  return (
    <div ref={containerRef} className="relative h-max w-full">
      <Stage ref={stageRef} width={stageWidth} height={stageHeight} scaleX={scale} scaleY={scale}>
        <Layer ref={layerRef}>
          {/* Background image */}
          {img && <KonvaImage image={img} x={0} y={0} width={img.width} height={img.height} listening={false} />}

          {/* Texts */}
          {state.texts.map(t => (
            <KonvaText
              key={t.id}
              id={t.id}
              ref={node => {
                if (node) textRefs.current[t.id] = node
              }}
              x={t.x}
              y={t.y}
              width={t.width}
              text={t.text}
              fontSize={t.fontSize}
              fill={t.color}
              fontStyle={t.fontStyle}
              rotation={t.rotation}
              fontFamily={MEASURE_FONT_FAMILY}
              wrap="word"
              lineHeight={1.2}
              draggable
              onMouseDown={() => selectAndAttach(t.id)}
              onClick={() => selectAndAttach(t.id)}
              onTap={() => selectAndAttach(t.id)}
              onDragEnd={e => {
                const { x, y } = e.target.position()
                setState(prev => ({
                  ...prev,
                  texts: prev.texts.map(tt => (tt.id === t.id ? { ...tt, x, y } : tt)),
                }))
                selectAndAttach(t.id)
              }}
              onTransformEnd={e => {
                const node = e.target
                const scaleX = node.scaleX()
                const newWidth = Math.max(20, node.width() * scaleX)
                const rotation = node.rotation()
                node.scaleX(1)
                setState(prev => ({
                  ...prev,
                  texts: prev.texts.map(tt =>
                    tt.id === t.id ? { ...tt, width: newWidth, height: tt.height, rotation } : tt,
                  ),
                }))
                recomputeHeightFor(t.id)
                selectAndAttach(t.id)
              }}
            />
          ))}

          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['middle-left', 'middle-right']}
            boundBoxFunc={(oldBox, newBox) => {
              return { ...newBox, height: oldBox.height, y: oldBox.y }
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
})
