'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import _ from 'lodash'
import { useMemo } from 'react'
import { CommonToggleSwitch, LookupComboboxFilterSSR } from '@repo/ui'
import { Label } from '@repo/ui/components/label'
import { Input } from '@repo/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'

interface Props {
  filterOptions?: any
  setIsEnabled?: any
}
export default function Filters({ filterOptions, setIsEnabled }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // const [params, setTempParams] = useState<any>({})
  const params = useMemo(() => {
    const newParams = {}
    searchParams?.forEach((value, name) => {
      newParams[name] = value
    })
    return newParams
  }, [searchParams])

  function handleSetFilter(e) {
    const newFilter = { ...params }
    _.set(newFilter, e.target.name, e.target.value?.toString() ?? '')
    _.set(newFilter, 'page', '1')
    // setTempParams(newFilter)
    router.push(`${pathname}?${new URLSearchParams(newFilter)}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-4 md:gap-x-4">
      {filterOptions?.map((filterOption, index) => {
        if (filterOption.type === 'select') {
          const filterValue = _.get(params, filterOption.key) ?? filterOption.options[0].value
          return (
            <div className="flex items-center gap-2" key={index}>
              <Label className="min-w-fit text-sm font-semibold">{filterOption.label}</Label>
              <Select
                value={filterValue}
                onValueChange={value => handleSetFilter({ target: { name: filterOption.key, value } })}>
                <SelectTrigger className="w-fit min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOption.options?.map((option, optIdx) => (
                    <SelectItem key={optIdx} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
        if (filterOption.type === 'toggle') {
          const filterValue =
            (_.get(params, filterOption.key) ?? filterOption.default) === 'true' ||
            (_.get(params, filterOption.key) ?? filterOption.default) === true
          return (
            <div className="flex items-center gap-2" key={index}>
              <Label className="min-w-fit text-sm font-semibold">{filterOption.label}</Label>
              <CommonToggleSwitch
                value={filterValue}
                handleToggle={newValue => handleSetFilter({ target: { name: filterOption.key, value: newValue } })}
              />
            </div>
          )
        }
        if (filterOption.type === 'lookupCombobox') {
          const filterValue = _.get(params, filterOption.key) ?? ''
          return (
            <div className="flex items-center gap-2" key={index}>
              <Label className="min-w-fit text-sm font-semibold">{filterOption.label}</Label>
              <LookupComboboxFilterSSR
                value={filterValue}
                lookupDisplayValue={filterOption.displayValue}
                searchParams={params}
                params={filterOption.params}
                getData={filterOption.getData}
                handleChange={newValue => {
                  handleSetFilter({ target: { name: filterOption.key, value: newValue.id } })
                }}
              />
            </div>
          )
        }
        if (filterOption.type === 'datetime') {
          const filterValue = _.get(params, filterOption.key) ?? filterOption.defaultValue ?? undefined
          return (
            <div className="flex items-center gap-2" key={index}>
              <Label className="min-w-fit text-sm font-medium">{filterOption.label}</Label>
              <Input
                type="date"
                value={filterValue}
                name={filterOption.key}
                min="1900-01-01"
                max="3000-01-01"
                onChange={e => handleSetFilter(e)}
                className="w-36"
              />
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
