'use client'
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, ComboboxButton, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { Fragment, useDeferredValue, useEffect, useState } from 'react'
import _ from 'lodash'
import { useAsyncEffect } from '@repo/utils'

interface props {
  value: any
  handleChange: any
  lookupDisplayValue: any
  params?: any
  getData: any
  readOnly?: boolean
  placeholder?: string
}
export function LookupComboboxSSR({
  value,
  handleChange,
  getData,
  lookupDisplayValue,
  params,
  readOnly = false,
  placeholder,
}: props) {
  const [query, setQuery] = useState('')
  const [listData, setListData] = useState<any[]>([])

  const deferredQuery = useDeferredValue(query)
  useAsyncEffect(async () => {
    const data = await getData({ query: deferredQuery, ...params })
    setListData(data)
  }, [deferredQuery, params])

  if (readOnly)
    return (
      <div className="relative mt-1 w-full">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md md:text-sm">
          <div className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0">
            {_.get(value, lookupDisplayValue, placeholder ?? '')}
          </div>
        </div>
      </div>
    )
  return (
    <Combobox value={value} onChange={handleChange}>
      <div className="relative mt-1 box-content w-full">
        <div className="relative w-full cursor-default rounded-lg bg-white text-left text-sm shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300">
          <ComboboxInput
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            placeholder={placeholder}
            displayValue={value => _.get(value, lookupDisplayValue, '')}
            onChange={event => setQuery(event.target.value)}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </ComboboxButton>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}>
          <ComboboxOptions className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white px-2 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none md:text-sm">
            {listData?.length === 0 ? (
              <div className="relative cursor-default select-none px-4 py-2 text-zinc-700">검색 결과가 없습니다.</div>
            ) : (
              listData?.map((lookupItem: any, idx) => (
                <ComboboxOption
                  key={idx}
                  className={`relative cursor-default select-none py-1.5 pl-10 pr-4 text-xs focus:bg-indigo-500`}
                  // style={{
                  //   backgroundColor: active ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                  // }}
                  value={lookupItem}>
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate text-xs ${selected ? 'font-medium' : 'font-normal'}`}>
                        {_.get(lookupItem, lookupDisplayValue)}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 flex items-center pl-3 ${
                            active ? 'bg-zinc-600 text-indigo-500' : 'text-zinc-600'
                          }`}
                          style={{
                            right: '4px',
                            // backgroundColor: active ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                          }}>
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  )
}
