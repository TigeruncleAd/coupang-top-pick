'use client'
import { useEffect, useRef, useState } from 'react'

export default function DynamicHeightTextBox({
  defaultRows = 5,
  value,
  onChange,
  placeholder = '',
  resizable = false,
  className,
  maxLength = 5000,
  ...props
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!textAreaRef?.current) return
    textAreaRef.current.style.height = 'auto'
    textAreaRef.current.style.height = textAreaRef?.current?.scrollHeight + 4 + 'px'
  }, [value])

  return (
    <textarea
      ref={textAreaRef}
      className={className}
      placeholder={placeholder}
      rows={defaultRows}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      style={{ resize: resizable ? 'vertical' : 'none' }}
      {...props}
    />
  )
}
