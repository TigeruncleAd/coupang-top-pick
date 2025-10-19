'use client'
import { useCallback, useRef, useState } from 'react'

export function useEditorHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial)
  const undoStack = useRef<T[]>([])
  const redoStack = useRef<T[]>([])
  const savedRef = useRef<T>(initial)

  const set = useCallback((updater: (prev: T) => T) => {
    setState(prev => {
      const next = updater(prev)
      undoStack.current.push(prev)
      redoStack.current = []
      return next
    })
  }, [])

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    setState(prev => {
      const last = undoStack.current.pop() as T
      redoStack.current.push(prev)
      return last
    })
  }, [])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    setState(prev => {
      const next = redoStack.current.pop() as T
      undoStack.current.push(prev)
      return next
    })
  }, [])

  const markSaved = useCallback(() => {
    savedRef.current = state
  }, [state])

  const isDirty = useCallback(() => {
    return JSON.stringify(savedRef.current) !== JSON.stringify(state)
  }, [state])

  const reset = useCallback(
    (value?: T) => {
      if (value !== undefined) {
        undoStack.current = []
        redoStack.current = []
        savedRef.current = value
        setState(value)
        return
      }
      undoStack.current = []
      redoStack.current = []
      savedRef.current = state
    },
    [state],
  )

  return { state, setState: set, undo, redo, isDirty, markSaved, reset }
}
