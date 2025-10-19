'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageTitle from '../../(_components)/PageTitle'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function IndexMeasurementPage() {
  const [keyword, setKeyword] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (!keyword.trim()) return
    router.push(`/blog/index-measurement/result?keyword=${encodeURIComponent(keyword)}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full">
      <PageTitle title="블로그 지수 측정" description="블로그 키워드의 지수를 측정하고 분석하세요" />

      {/* 메인 컨텐츠 */}
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-4xl px-4 text-center">
          {/* 메인 타이틀 */}
          <div className="mb-12">
            <h1 className="mb-4 text-5xl font-bold">
              블로그 지수{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">2.0</span>
            </h1>
            <p className="text-muted-foreground text-xl">보고싶은 블로그 지수를 쉽게 확인하세요!</p>
          </div>

          {/* 검색 박스 */}
          <div className="mb-8">
            <div className="relative mx-auto max-w-2xl">
              <Input
                type="text"
                placeholder="블로그 주소/아이디를 입력하세요"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-14 pr-14 text-lg"
              />
              <Button onClick={handleSearch} size="sm" className="absolute right-2 top-2 h-10 w-10 p-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 검색 버튼 */}
          {/* <div className="mb-8">
            <Button
              onClick={handleSearch}
              size="lg"
              className="px-8 py-3 text-lg font-medium"
              disabled={!keyword.trim()}>
              검색
            </Button>
          </div> */}

          {/* 하단 텍스트 */}
          {/* <p className="text-muted-foreground text-sm">
            현재 네이버에서 서비스하고 있는 감정점과 다른 기준으로 측정하고 있습니다. 이에 따라 차이가 수치는 같이
            변동이 있습니다. 안정화되면 다시 표시하겠습니다. 지수 부분은 변동이 없습니다.
          </p> */}
        </div>
      </div>
    </div>
  )
}
