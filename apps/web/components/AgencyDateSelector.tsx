'use client'

import { useAgencyDate } from '@/hooks/useAgencyDate'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { useState } from 'react'

export default function AgencyDateSelector({ useSearch = false }) {
  const [date, setDate, query, setQuery] = useAgencyDate()
  const [localQuery, setLocalQuery] = useState(query)
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log('handleSubmit', localQuery)
    setQuery(localQuery)
  }
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="min-w-fit text-sm font-medium">일자</Label>
        <Input
          type="date"
          value={date}
          name="date"
          min="1900-01-01"
          max="3000-01-01"
          onChange={e => setDate(e.target.value)}
          className="w-36"
        />

        <form className={`flex items-center gap-2 ${useSearch ? '' : 'hidden'}`} onSubmit={handleSubmit}>
          <Label className="min-w-fit text-sm font-medium" htmlFor="query">
            검색어
          </Label>
          <Input
            type="text"
            value={localQuery}
            name="query"
            onChange={e => setLocalQuery(e.target.value)}
            className="w-72"
          />
          <Button type="submit">검색</Button>
        </form>
      </div>
    </div>
  )
}
