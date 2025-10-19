import React, { ReactNode, useContext } from 'react'
import { IoChevronUpOutline } from 'react-icons/io5'
import { BiX } from 'react-icons/bi'
import { FormRenderContext } from './formRender'
import _ from 'lodash'

export function Array({
  label,
  itemKey,
  className,
  readOnly = false,
  labelClassName,
  arrayClassName,
  orderable = true,
  childrenWrapperClassName,
  children,
  defaultValue,
  showChildrenLabel = true,
}: {
  label: string
  itemKey: string
  className?: string
  readOnly?: boolean
  labelClassName?: string
  arrayClassName?: string
  childrenWrapperClassName?: string
  orderable?: boolean
  children: ReactNode
  defaultValue?: any
  showChildrenLabel?: boolean
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ?? []
  const error = _.get(formErrors, itemKey)
  return (
    <div className={className ?? ''}>
      {label && (
        <label htmlFor={itemKey} className={labelClassName ?? 'mb-2 block text-sm font-medium leading-6'}>
          {label}
        </label>
      )}
      <div className={arrayClassName ?? 'space-y-4'}>
        {value.map((item, index) => {
          const childrenWithProps = React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement<any>(child, { itemKey: `${itemKey}.${index}.${(child.props as any).itemKey}` })
            }
            return child
          })
          return (
            <div key={index} className="rounded-md border p-4">
              {showChildrenLabel && (
                <div className="mb-2 flex justify-center border-b pb-4 text-sm font-semibold">
                  {label} {index + 1}
                </div>
              )}
              <div className="flex w-full items-center gap-2">
                {orderable && !readOnly && (
                  <div className="flex flex-[0_0_1] flex-col gap-2">
                    <button
                      type="button"
                      className="text-gray3 h-6 w-6 shrink-0 rounded-full"
                      onClick={() => {
                        if (index === 0) return
                        const newForm = _.cloneDeep(form)
                        const newValue = _.cloneDeep(value)
                        const temp = newValue[index]
                        newValue[index] = newValue[index - 1]
                        newValue[index - 1] = temp
                        _.set(newForm, itemKey, newValue)
                        setForm(newForm)
                      }}>
                      <IoChevronUpOutline className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="text-gray3 h-6 w-6 shrink-0 rounded-full"
                      onClick={() => {
                        if (index === value.length - 1) return
                        const newForm = _.cloneDeep(form)
                        const newValue = _.cloneDeep(value)
                        const temp = newValue[index]
                        newValue[index] = newValue[index + 1]
                        newValue[index + 1] = temp
                        _.set(newForm, itemKey, newValue)
                        setForm(newForm)
                      }}>
                      <IoChevronUpOutline className="h-6 w-6 rotate-180 transform" />
                    </button>
                  </div>
                )}
                <div className={childrenWrapperClassName ?? 'w-full'}>{childrenWithProps}</div>
                {!readOnly && (
                  <button
                    type="button"
                    className="h-4 w-4 shrink-0 rounded-full bg-red-500 text-white"
                    onClick={() => {
                      if (value.length === 0) return
                      const newForm = _.cloneDeep(form)
                      _.set(
                        newForm,
                        itemKey,
                        value?.filter((_, i) => i !== index),
                      )
                      setForm(newForm)
                    }}>
                    <BiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {!readOnly && (
        <button
          type="button"
          className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500"
          onClick={() => {
            const newForm = _.cloneDeep(form)
            _.set(newForm, itemKey, [...value, defaultValue ?? {}])
            setForm(newForm)
          }}>
          + {label ?? ''} 추가
        </button>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
