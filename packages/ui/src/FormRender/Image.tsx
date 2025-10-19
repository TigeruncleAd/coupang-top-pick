import { useContext, useState } from 'react'
import { FormRenderContext } from './formRender'
import _ from 'lodash'
import { BiX } from 'react-icons/bi'
import ImageDropBox from '../common/ImageDropBox'

export function Images({
  label,
  itemKey,
  dropBoxClassName,
  imageClassName,
  acceptableFileTypes,
  maxFileSize = 20,
  className,
  uploadKey,
  readOnly = false,
  dropBoxContent,
  resizeOptions,
}: {
  label: string
  itemKey: string
  imageClassName?: string
  dropBoxClassName?: string
  acceptableFileTypes?: string[]
  maxFileSize?: number
  className?: string
  uploadKey?: string[]
  readOnly?: boolean
  dropBoxContent?: any
  resizeOptions?: {
    maxWidth: number
    maxHeight: number
    quality: number
    compressFormat: 'WEBP' | 'JPEG' | 'PNG'
  }
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ?? []
  const error = _.get(formErrors, itemKey)
  const [targetIndex, setTargetIndex] = useState('')

  function dragover_handler(ev) {
    // Change the target element's border to indicate a drag over
    ev.preventDefault()
    document.querySelector('.ml-16')?.classList.remove('ml-16')
    ev.target.classList.add('ml-16')
  }

  function drop_handler(e) {
    e.preventDefault()
    const draggedIndex = e.dataTransfer.getData('index')
    const draggedSrc = e.dataTransfer.getData('src')
    const newForm = _.cloneDeep(form)
    const newValue = value.filter((_, i) => i !== parseInt(draggedIndex))
    newValue.splice(targetIndex, 0, draggedSrc)
    _.set(newForm, itemKey, newValue)
    setForm(newForm)
  }

  return (
    <div className={className ?? ''} key={itemKey}>
      <label className="mb-2 block text-sm font-medium leading-6">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2 overflow-auto" onDrop={drop_handler}>
        {value?.map((src, index) => {
          return (
            <div
              id={`${itemKey}-${index}`}
              key={index}
              className="relative shrink-0"
              draggable={true}
              onDragOver={e => {
                e.preventDefault()
                dragover_handler(e)
                setTargetIndex(index)
              }}
              onDragEnd={() => document.querySelector('.ml-16')?.classList.remove('ml-16')}
              onDragStart={e => {
                e.dataTransfer.setData('index', index)
                e.dataTransfer.setData('src', src)
              }}>
              <img className={imageClassName ?? ''} src={src} loading={'lazy'} alt={'image'} />
              {!readOnly && (
                <button
                  type="button"
                  className="absolute right-0 top-0 ml-4 text-sm font-medium leading-6 text-red-500"
                  onClick={() => {
                    const newForm = _.cloneDeep(form)
                    _.set(
                      newForm,
                      itemKey,
                      value?.filter((_, i) => i !== index),
                    )
                    setForm(newForm)
                  }}>
                  <BiX className="h-6 w-6" />
                </button>
              )}
            </div>
          )
        })}
      </div>
      {!readOnly && (
        <div>
          <ImageDropBox
            dropBoxClassName={dropBoxClassName}
            objectKey={itemKey}
            acceptableFileTypes={acceptableFileTypes}
            value={value}
            maxFileSize={maxFileSize ?? 10}
            uploadKey={uploadKey ?? ['files']}
            isSingle={false}
            dropboxText={dropBoxContent}
            handleChange={newValue => {
              const newForm = _.cloneDeep(form)
              _.set(newForm, itemKey, newValue)
              setForm(newForm)
            }}
            resizeOptions={resizeOptions}
          />
        </div>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}

export function Image({
  label,
  itemKey,
  dropBoxClassName,
  imageClassName,
  acceptableFileTypes,
  maxFileSize = 20,
  className,
  uploadKey,
  readOnly = false,
  dropBoxContent,
  resizeOptions,
}: {
  label: string
  itemKey: string
  imageClassName?: string
  dropBoxClassName?: string
  acceptableFileTypes?: string[]
  maxFileSize?: number
  className?: string
  uploadKey?: string[]
  readOnly?: boolean
  dropBoxContent?: any
  resizeOptions?: {
    maxWidth: number
    maxHeight: number
    quality: number
    compressFormat: 'WEBP' | 'JPEG' | 'PNG'
  }
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ?? ''
  const error = _.get(formErrors, itemKey)

  return (
    <div className={className ?? ''} key={itemKey}>
      <label className="mb-2 block text-sm font-medium leading-6">{label}</label>
      {value && (
        <div className="mb-2 flex gap-2 overflow-auto">
          <div className="relative shrink-0">
            <img className={imageClassName ?? ''} src={value} loading={'lazy'} alt={'image'} />
            {!readOnly && (
              <button
                type="button"
                className="absolute right-0 top-0 ml-4 text-sm font-medium leading-6 text-red-500"
                onClick={() => {
                  const newForm = _.cloneDeep(form)
                  _.unset(newForm, itemKey)
                  setForm(newForm)
                }}>
                <BiX className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
      {!readOnly && !value && (
        <div>
          <ImageDropBox
            dropBoxClassName={dropBoxClassName}
            objectKey={itemKey}
            acceptableFileTypes={acceptableFileTypes}
            value={value}
            maxFileSize={maxFileSize ?? 10}
            uploadKey={uploadKey ?? ['files']}
            isSingle={true}
            dropboxText={dropBoxContent}
            handleChange={newValue => {
              const newForm = _.cloneDeep(form)
              _.set(newForm, itemKey, newValue)
              setForm(newForm)
            }}
            resizeOptions={resizeOptions}
          />
        </div>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
