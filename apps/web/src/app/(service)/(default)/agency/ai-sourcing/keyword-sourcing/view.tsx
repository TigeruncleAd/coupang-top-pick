'use client'
import { useRouter } from 'next/navigation'
import { SearchedMall, User } from '@repo/database'
import { kdayjs, useServerAction } from '@repo/utils'
import { useEffect, useState } from 'react'
import Filters from '../../../../(_components)/ListTable/Filters'
import { deleteSearchedMalls, getSearchMall } from './serverAction'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { AlertTriangle } from 'lucide-react'
import BanWordsManager from './(_components)/BanWordsManager'
import SearchForm from './(_components)/SearchForm'
import MallCard from './(_components)/MallCard'
import PopupChecker from './(_components)/PopupChecker'
import MinMaxPriceManager from './(_components)/MinMaxPriceManager'
import { Label } from '@repo/ui/components/label'
import { Input } from '@repo/ui/components/input'
import { useQuery } from '@tanstack/react-query'
import ProductCrawler from './(_components)/ProductCrawler'
import { useAgencyDate } from '@/hooks/useAgencyDate'
import AgencyDateSelector from '@/components/AgencyDateSelector'

interface SearchMallViewProps {
  user: User & { banWords?: { banWords: string[] } | null }
  token: string
  detailClassCode: string
  extensionId: string
}

export default function SearchMallView({ user, token, detailClassCode, extensionId }: SearchMallViewProps) {
  const router = useRouter()
  const [selectedMallIds, setSelectedMallIds] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState(10000)
  const [maxPrice, setMaxPrice] = useState(200000)
  const [dateString, setDateString] = useAgencyDate()
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

  const { data: searchedMallData, refetch } = useQuery({
    queryKey: ['search-mall', dateString],
    queryFn: () => getSearchMall({ date: dateString }),
    enabled: !!dateString,
  })
  const listData = searchedMallData?.listData ?? []

  const isAllSelected = listData.length > 0 && selectedMallIds.length === listData.length

  const { execute: executeDeleteMalls, isLoading: isDeleteMallsLoading } = useServerAction(deleteSearchedMalls, {
    onSuccess: ({ message }) => {
      toast.success(message)
      refetch()
    },
  })

  const handleMallSelect = (keyword: string, isSelected: boolean) => {
    setSelectedMallIds(prev => (isSelected ? [...prev, keyword] : prev.filter(k => k !== keyword)))
  }

  const handleSelectAll = () => {
    setSelectedMallIds(isAllSelected ? [] : (listData?.map(item => item.keyword) ?? []))
  }

  // window.open(
  //   `${mall.mallPcUrl}/category/ALL?st=POPULAR&ksToken=${encodeURIComponent(token)}&mallId=${mall.id}&detailClassCode=${detailClassCode}&np=${minPrice}&mp=${maxPrice}`,
  //   '_blank',
  //   POPUP_WINDOW_SPECS,
  // )

  return (
    <>
      <PopupChecker />
      <div className="min-h-screen space-y-4 p-4">
        <Alert>
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold">중요 경고 - 상품 수집 시 주의사항</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              상품 수집 중 <span className="font-bold">절대로</span> 다른 페이지로 이동하거나, 여러 탭을 열어 동시에
              작업을 진행하지 마세요.
            </p>
            <p>네이버 스마트스토어를 자체적으로 탐색하지도 마세요.</p>
            <p className="text-destructive text-lg font-bold underline">⚡ 즉시 차단 당합니다!!</p>
            <p className="text-sm">크롤링 중에는 아예 다른 행동을 하는 것을 권장하지 않습니다.</p>
          </AlertDescription>
        </Alert>

        {/* 일자 선택 입력창, 검색어 입력창, 쇼핑몰 수집 버튼, 상품 수집 버튼. */}
        <div className="mb-4 flex items-center gap-4">
          <AgencyDateSelector />
          <SearchForm token={token} onSearch={() => refetch()} license={user?.license} extensionId={extensionId} />
          {/* <Button
            onClick={() => {
              setCurrentCrawlingIdx(0)
              setIsAutoCrawling(!isAutoCrawling)
            }}
            variant={isAutoCrawling ? 'destructive' : 'default'}
            className="shrink-0">
            {isAutoCrawling ? '상품 수집 중지' : '상품 수집 시작'}
          </Button> */}
        </div>

        <Card className="mb-4">
          <CardContent className="flex w-full items-center gap-4">
            <BanWordsManager user={user} onUpdate={() => router.refresh()} />
            <MinMaxPriceManager
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
            />
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="py-4 text-lg font-semibold">{listData.length}개의 키워드</div>
          <div className="flex items-center gap-2 pb-4">
            <Button onClick={handleSelectAll} variant="default">
              {isAllSelected ? '전체 선택 해제' : '전체 선택'}
            </Button>
            <Button
              onClick={() => executeDeleteMalls({ keywords: selectedMallIds, date: dateString })}
              variant="destructive"
              disabled={isDeleteMallsLoading || selectedMallIds.length === 0}>
              선택 삭제
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listData.map((mall, index) => (
            <MallCard
              key={mall.keyword}
              keyword={mall.keyword}
              totalCount={mall.totalCount}
              crawledCount={mall.crawledCount}
              isSelected={selectedMallIds.includes(mall.keyword)}
              onSelect={handleMallSelect}
              onClick={() => setSelectedKeyword(mall.keyword)}
            />
          ))}
        </div>
      </div>
      {selectedKeyword && (
        <ProductCrawler
          extensionId={extensionId}
          token={token}
          detailClassCode={detailClassCode}
          minPrice={minPrice}
          maxPrice={maxPrice}
          keyword={selectedKeyword}
          dateString={dateString}
          onClose={() => {
            refetch()
            setSelectedKeyword(null)
          }}
        />
      )}
    </>
  )
}
