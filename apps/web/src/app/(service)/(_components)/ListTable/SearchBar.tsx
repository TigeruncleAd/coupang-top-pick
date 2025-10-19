'use client'
import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
type searchOption = {
  label: string
  options: {
    label: string
    value: string
  }[]
}

export default function SearchBar({ searchOption }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const searchKeyParam = searchParams?.get('searchKey') ?? ''
  const searchKeywordParam = searchParams?.get(searchKeyParam) ?? ''
  const [searchKey, setSearchKey] = useState(searchKeyParam || searchOption?.options[0]?.value)
  const [tempKeyword, setTempKeyword] = useState<string>(searchKeywordParam || '')

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  function handleSearch() {
    if (!searchParams) return
    const params = new URLSearchParams(searchParams)
    const prevSearchKey = params.get('searchKey')
    if (prevSearchKey) params.delete(prevSearchKey)

    params.set(searchKey, tempKeyword)
    params.set('searchKey', searchKey)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }
  if (!searchOption) return null
  return (
    <div className="flex items-center">
      <div className="mr-2">
        <label className="block text-sm font-medium leading-6 text-gray-900">{searchOption?.label}</label>
        <select
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 lg:max-w-xs lg:text-sm lg:leading-6"
          value={searchKey}
          onChange={e => setSearchKey(e.target.value)}>
          {searchOption?.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex items-center">
        <input
          type="text"
          name="search"
          id="search"
          placeholder={searchOption?.placeholder}
          value={tempKeyword}
          onChange={e => setTempKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 md:text-sm md:leading-6"
        />
        <div className="absolute inset-y-0 right-0 flex cursor-pointer py-1.5 pr-1.5" onClick={handleSearch}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke={'gray'}
            className="h-6 w-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
