import { useContext, useRef } from 'react'
import { ModalButton } from '../common/ModalButton'
import DaumPostcodeEmbed from 'react-daum-postcode'
import { FormRenderContext } from './formRender'
import _ from 'lodash'

export function Address({
  label,
  itemKey,
  className,
  readOnly = false,
  placeholder,
  required = false,
}: {
  label: string
  itemKey: string
  className?: string
  readOnly?: boolean
  placeholder?: string
  required?: boolean
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext)
  const value = _.get(form, itemKey) ?? ''
  const error = _.get(formErrors, itemKey)
  const closeRef = useRef<any>(null)

  function onComplete(data) {
    let fullAddress = data.address
    let extraAddress = ''

    if (data.addressType === 'R') {
      if (data.bname !== '') {
        extraAddress += data.bname
      }
      if (data.buildingName !== '') {
        extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName
      }
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : ''
    }

    let newForm = _.cloneDeep(form)
    _.set(newForm, itemKey, fullAddress)
    setForm(newForm)
    closeRef.current?.()
  }

  return (
    <div className={className ?? ''} key={itemKey}>
      <label htmlFor={itemKey} className="mb-2 block text-sm font-medium leading-6">
        {label}
      </label>
      <div>
        {readOnly ? (
          <input
            id={itemKey}
            readOnly={readOnly}
            type="text"
            className="border-grayD w-full rounded-md bg-white px-4 py-2 text-sm"
            value={value}
          />
        ) : (
          <ModalButton
            modalContent={<DaumPostcodeEmbed onComplete={onComplete} onClose={closeRef.current?.()} />}
            closeRef={closeRef}
            modalClassName={'w-full bg-white max-w-xl rounded-md shadow-xl overflow-hidden px-4 pt-12 relative'}
            className="w-full">
            <input
              id={itemKey}
              readOnly
              type="text"
              className="border-grayD w-full rounded-md bg-zinc-100 px-4 py-2 text-sm"
              placeholder={placeholder ?? `클릭하여 주소를 검색해주세요.`}
              value={value}
              required={required}
            />
          </ModalButton>
        )}
      </div>
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
