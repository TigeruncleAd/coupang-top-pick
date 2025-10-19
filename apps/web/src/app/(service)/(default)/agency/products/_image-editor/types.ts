import type { AnalyzedTextBox } from '@/types/analyze/editor'
export type EditorTool = 'pointer'

export type EditorTextItem = {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  color: string
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic'
  rotation: number
}

export type EditorState = {
  texts: EditorTextItem[]
  imageUrl: string
}

export type EditorExposeRef = {
  isDirty: () => boolean
  markSaved: () => void
  reset: () => void
  exportImage: () => string | null
  undo: () => void
  redo: () => void
  addText: (preset?: Partial<Omit<EditorTextItem, 'id'>>) => void
  deleteSelected: () => void
  updateSelectedTextStyle: (
    preset: Partial<Pick<EditorTextItem, 'fontSize' | 'color' | 'fontStyle' | 'rotation' | 'width' | 'height'>>,
  ) => void
  updateSelectedTextContent: (text: string) => void
  getSelectedText: () => EditorTextItem | null
  subscribeSelection: (listener: (text: EditorTextItem | null) => void) => () => void
  getBoxes: () => AnalyzedTextBox[]
}
