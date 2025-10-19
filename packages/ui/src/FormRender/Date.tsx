import { useContext } from 'react'
import { kdayjs } from '@repo/utils'
import { FormRenderContext } from './formRender'
import _ from 'lodash'

export function Date({
  label,
  itemKey,
  required,
  dateClassName,
  className,
  readOnly = false,
  min = '1000-01-01',
  max = '3000-01-01',
}: {
  label: string
  itemKey: string
  required?: boolean
  dateClassName?: string
  className?: string
  readOnly?: boolean
  min?: string
  max?: string
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ? kdayjs(_.get(form, itemKey)).format('YYYY-MM-DD') : null
  const error = _.get(formErrors, itemKey)
  const defaultClassName =
    'text-sm block w-full rounded-md py-2 text-gray3 shadow-sm placeholder:text-gray7 max-w-[210px] border-grayD px-2'

  return (
    <div key={itemKey} className={className ?? ''}>
      <label htmlFor={itemKey} className="mb-2 block text-sm font-medium leading-6">
        {label}
      </label>
      <input
        type="date"
        defaultValue={value}
        min={min}
        max={max}
        readOnly={readOnly}
        required={true}
        onChange={e => {
          let newForm = _.cloneDeep(form)
          _.set(newForm, itemKey, kdayjs(e.target.value).toDate())
          setForm(newForm)
        }}
        className={dateClassName ?? defaultClassName}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
export function DateTime({
  label,
  itemKey,
  required,
  dateClassName,
  className,
  readOnly = false,
  min = '1000-01-01',
  max = '3000-01-01',
}: {
  label: string
  itemKey: string
  required?: boolean
  dateClassName?: string
  className?: string
  readOnly?: boolean
  min?: string
  max?: string
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ? kdayjs(_.get(form, itemKey)).format('YYYY-MM-DDTHH:mm') : null
  const error = _.get(formErrors, itemKey)
  const defaultClassName =
    'text-sm block w-full rounded-md py-2 text-gray3 shadow-sm placeholder:text-gray7 max-w-[210px] border-grayD readOnly:border-grayF px-2'

  return (
    <div key={itemKey} className={className ?? ''}>
      <label htmlFor={itemKey} className="mb-2 block text-sm font-medium leading-6">
        {label}
      </label>
      <input
        type="datetime-local"
        defaultValue={value}
        min={min}
        max={max}
        onChange={e => {
          let newForm = _.cloneDeep(form)
          _.set(newForm, itemKey, kdayjs(e.target.value).toDate())
          setForm(newForm)
        }}
        readOnly={readOnly}
        className={dateClassName ?? defaultClassName}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
