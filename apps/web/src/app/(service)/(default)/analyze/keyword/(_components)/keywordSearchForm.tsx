'use client'

import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KeywordSearchForm({ initialKeyword }: { initialKeyword?: string }) {
  const router = useRouter()
  const [keyword, setKeyword] = useState(initialKeyword || '')
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (keyword === initialKeyword) return
    router.push(`/analyze/keyword/${keyword}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-4">
      <Input
        placeholder="키워드를 입력해주세요."
        type="search"
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
      />
      <Button>검색</Button>
    </form>
  )
}
