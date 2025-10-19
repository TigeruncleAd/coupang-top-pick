import { useContext } from 'react'
import { FormRenderContext } from './formRender'
import _ from 'lodash'
import InfoIcon from '../common/InfoIcon'
export function Text({
  label,
  itemKey,
  required,
  placeholder,
  className,
  readOnly = false,
  type = 'text',
  inputClassName,
  info,
}: {
  label?: string
  itemKey: string
  required?: boolean
  placeholder?: string
  className?: string
  readOnly?: boolean
  type?: string
  inputClassName?: string
  info?: string
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ?? ''
  const error = _.get(formErrors, itemKey)
  const defaultInputClassName = 'w-full rounded-md px-4 py-2 text-sm border-grayD bg-zinc-100 read-only:bg-white'
  return (
    <div className={className ?? ''}>
      {(label || info) && (
        <div className="mb-2 flex items-center gap-2">
          {label && (
            <label htmlFor={itemKey} className="block text-sm font-medium leading-6">
              {label}
            </label>
          )}
          {info && <InfoIcon info={info} />}
        </div>
      )}
      <input
        id={itemKey}
        required={required}
        readOnly={readOnly}
        type={type}
        className={inputClassName ?? defaultInputClassName}
        placeholder={placeholder ?? `${label} 을/를 입력해주세요`}
        onChange={e => {
          let newForm = _.cloneDeep(form)
          _.set(newForm, itemKey, e.target.value)
          setForm(newForm)
        }}
        value={value}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
