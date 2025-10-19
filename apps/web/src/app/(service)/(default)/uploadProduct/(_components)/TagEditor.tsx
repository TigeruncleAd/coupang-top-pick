import { useEffect, useState } from 'react'

export default function TagEditor({ tags, handleChange }: { tags: string[]; handleChange: (tags: string[]) => void }) {
  const [tag, setTag] = useState(tags.join(','))
  useEffect(() => {
    setTag(tags.join(','))
  }, [tags])
  const [isDirty, setIsDirty] = useState(false)
  return (
    <div className="flex w-full items-center gap-2 rounded-md border p-2">
      <div className="shrink-0">태그 : </div>
      <div className="w-full">
        <input
          type="text"
          value={tag}
          className={`w-full rounded-md border border-gray-300 py-1 text-sm ${isDirty ? 'border-blue-500' : ''}`}
          onChange={e => {
            setTag(e.target.value)
            setIsDirty(true)
          }}
          onBlur={() => {
            if (isDirty) {
              handleChange(tag.split(',').filter(tag => tag.trim() !== ''))
              setIsDirty(false)
            }
          }}
        />
      </div>
      <button
        className="shrink-0 px-2 text-blue-500 underline"
        onClick={() => {
          handleChange(tag.split(',').filter(tag => tag.trim() !== ''))
          setIsDirty(false)
        }}>
        적용
      </button>
    </div>
  )
}
