import { useContext } from 'react'
import { FormRenderContext } from './formRender'
import _ from 'lodash'
import { BiX } from 'react-icons/bi'
export function Texts({
  label,
  itemKey,
  required,
  placeholder,
  className,
  readOnly = false,
  type = 'text',
  inputClassName,
}: {
  label?: string
  itemKey: string
  required?: boolean
  placeholder?: string
  className?: string
  readOnly?: boolean
  type?: string
  inputClassName?: string
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ?? []
  const error = _.get(formErrors, itemKey)
  const defaultInputClassName = 'w-full rounded-md px-4 py-2 text-sm border-grayD bg-zinc-100 read-only:bg-white'
  return (
    <div className={className ?? ''}>
      {label && (
        <label htmlFor={itemKey} className="mb-2 block text-sm font-medium leading-6">
          {label}
        </label>
      )}
      <div className="flex flex-col gap-2">
        {value.map((v, i) => (
          <div key={i} className="flex w-full items-center gap-4">
            <input
              required={required}
              readOnly={readOnly}
              type={type}
              className={inputClassName ?? defaultInputClassName}
              placeholder={placeholder ?? `${label} 을/를 입력해주세요`}
              onChange={e => {
                let newForm = _.cloneDeep(form)
                const newValue = [...value]
                newValue[i] = e.target.value
                _.set(newForm, itemKey, newValue)
                setForm(newForm)
              }}
              value={v}
            />
            {!readOnly && (
              <button
                className="h-4 w-4 rounded-full bg-red-500 text-white"
                type="button"
                onClick={() => {
                  const newForm = _.cloneDeep(form)
                  const newValue = [...value]
                  newValue.splice(i, 1)
                  _.set(newForm, itemKey, newValue)
                  setForm(newForm)
                }}>
                <BiX className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          const newForm = _.cloneDeep(form)
          const newValue = value.concat('')
          _.set(newForm, itemKey, newValue)
          setForm(newForm)
        }}
        type={'button'}
        className="mt-2 rounded-md bg-indigo-600 px-2 py-1 text-white">
        +
      </button>
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
