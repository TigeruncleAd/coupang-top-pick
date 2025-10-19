'use client'

import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaArrowsAlt } from 'react-icons/fa'

interface SortableItemProps {
  id: string
  idx: number
  option: { name: string; price: number; optionName1: string }
  handleChange: (options: { name: string; price: number; optionName1: string }[]) => void
  options: { name: string; price: number; optionName1: string }[]
}

function SortableItem({ id, idx, option, handleChange, options }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    transition: {
      duration: 100,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-md border p-1">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <FaArrowsAlt className="h-4 w-4 text-gray-400" />
      </div>
      <div>{idx + 1}. </div>
      <input
        type="text"
        id={`option-name-${idx}`}
        value={option.name || option.optionName1 || ''}
        onChange={e => {
          const newOptions = [...options]
          newOptions[idx + 1].optionName1 = e.target.value
          handleChange(newOptions)
        }}
        className="w-64 rounded-md border border-gray-300 py-1 text-sm"
      />
      <input
        type="number"
        id={`option-price-${idx}`}
        value={option.price}
        onChange={e => {
          const newOptions = [...options]
          newOptions[idx + 1].price = parseInt(e.target.value)
          handleChange(newOptions)
        }}
        className="w-24 rounded-md border border-gray-300 py-1 text-sm"
      />
      <button
        className="rounded-md text-sm text-red-500 underline"
        onClick={() => handleChange(options.filter((_, i) => i !== idx + 1))}>
        삭제
      </button>
    </div>
  )
}

export default function OptionEditor({
  options,
  handleChange,
  optionGroup1,
  optionGroup2,
  optionGroup3,
}: {
  options: { name: string; price: number; optionName1: string; optionName2: string; optionName3: string }[]
  handleChange: (option: { name: string; price: number }[]) => void
  optionGroup1: string
  optionGroup2: string
  optionGroup3: string
}) {
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = parseInt(active.id)
      const newIndex = parseInt(over.id)

      const newOptions = [...options]
      const [removed] = newOptions.splice(oldIndex + 1, 1)
      const result = newOptions.splice(newIndex + 1, 0, removed)

      handleChange(newOptions)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <div>옵션 그룹 명 : </div>
        <input
          type="text"
          value={options[0]?.name ?? optionGroup1 ?? ''}
          className="rounded-md border border-gray-300 py-1 text-sm"
          onChange={e => {
            const newOptions = [...options]
            newOptions[0].name = e.target.value
            handleChange(newOptions)
          }}
        />
        {optionGroup2 && (
          <div>
            <input type="text" value={optionGroup2} className="rounded-md border border-gray-300 py-1 text-sm" />
          </div>
        )}
        {optionGroup3 && (
          <div>
            <input type="text" value={optionGroup3} className="rounded-md border border-gray-300 py-1 text-sm" />
          </div>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={options.slice(1).map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
          <div className="mt-2 grid-cols-2 gap-2 sm:grid">
            {options.slice(1).map((option, idx) => (
              <SortableItem
                key={idx}
                id={idx.toString()}
                idx={idx}
                option={option}
                handleChange={handleChange}
                options={options}
              />
            ))}
            <button
              className="rounded-md bg-blue-500 px-4 py-2 text-white"
              onClick={() => {
                handleChange([...options, { name: '', price: 0 }])
              }}>
              추가
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
