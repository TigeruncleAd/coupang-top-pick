'use client'

//test2
import { createContext, ReactNode, useContext, useRef } from 'react'
import _ from 'lodash'
import { LookupComboboxSSR } from '../common/LookupCombobox/LookupComboboxSSR'
import { BiX } from 'react-icons/bi'
import { ActionButton } from '../common/ActionButton'
import { Text } from './Text'
import { Toggle } from './Toggle'
import { Numbers } from './Number'
import { TextArea } from './TextArea'
import { File } from './File'
import { Image, Images } from './Image'
import { Array } from './Array'
import { DateTime, Date } from './Date'
import { Select } from './Select'
import { Address } from './Address'
import { Texts } from './Texts'
export const FormRenderContext = createContext({
  form: {},
  setForm: data => {},
  formErrors: {},
})

export function FormRender(props: {
  children: ReactNode
  form: any
  setForm: any
  onSubmit?: any
  className?: string
  formErrors?: any
}) {
  const { form, setForm, formErrors } = props
  return (
    <FormRenderContext.Provider value={{ form, setForm, formErrors }}>
      <form
        onSubmit={e => {
          e.preventDefault()
          props.onSubmit && props.onSubmit(e)
        }}
        className={props.className ?? ''}>
        {props.children}
      </form>
    </FormRenderContext.Provider>
  )
}

function LookupCombobox({
  label,
  itemKey,
  getData,
  displayValue,
  params,
  className,
  clearButton = false,
  readOnly = false,
  placeholder,
}: {
  label: string
  itemKey: string
  getData: any
  displayValue: string
  params?: (form: any) => any
  className?: string
  clearButton?: boolean
  readOnly?: boolean
  placeholder?: string
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey)
  const error = _.get(formErrors, itemKey)

  return (
    <div key={itemKey} className={className ?? ''}>
      <label htmlFor={itemKey} className="mb-2 block text-sm font-medium leading-6">
        {label}
      </label>
      <div className="flex w-full items-center gap-2">
        <LookupComboboxSSR
          value={value}
          lookupDisplayValue={displayValue}
          getData={getData}
          handleChange={newValue => {
            const newForm = {
              ...form,
            }
            _.set(newForm, itemKey, newValue)
            setForm(newForm)
          }}
          params={params ? params(form) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
        />
        {clearButton && (
          <button
            className="h-4 w-4 rounded-full bg-red-500 text-white"
            type="button"
            onClick={() => {
              const newForm = _.cloneDeep(form)
              _.unset(newForm, itemKey)

              setForm(newForm)
            }}>
            <BiX className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}

function SubmitButton({
  className,
  onClick,
  isLoading = false,
  children,
  ...props
}: {
  className?: string
  onClick?: any
  isLoading?: boolean
  children?: ReactNode
}) {
  return (
    <ActionButton
      {...{
        type: 'submit',
        className: className ?? 'rounded-md bg-gray-500 px-4 py-2 text-white w-full text-sm hover:opacity-80',
        isLoading: isLoading,
        onClick: onClick,
        ...props,
      }}>
      {children ?? '저장'}
    </ActionButton>
  )
}

FormRender.Text = Text
FormRender.Texts = Texts
FormRender.Toggle = Toggle
FormRender.Number = Numbers
FormRender.TextArea = TextArea
FormRender.File = File
FormRender.DateTime = DateTime
FormRender.Date = Date
FormRender.LookupCombobox = LookupCombobox
FormRender.Select = Select
FormRender.SubmitButton = SubmitButton
FormRender.Array = Array
FormRender.Image = Image
FormRender.Images = Images
FormRender.Address = Address
