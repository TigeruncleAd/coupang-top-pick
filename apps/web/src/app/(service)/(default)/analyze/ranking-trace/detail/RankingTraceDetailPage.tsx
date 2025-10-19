'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTrackedProductDetail, TrackedProductResult } from '../trackedProductServerAction'
import { getExtensionId } from '@/serverActions/extension/extension.action'
import KeywordRankingCharts from './components/KeywordRankingCharts'
import CompetitorProductList from './components/CompetitorProductList'
import CompetitorTrackingTable from './components/CompetitorTrackingTable'
import CompetitorComparison from './components/CompetitorComparison'
import { TrackingKeywords } from './components/TrackingKeywords'
import { KeywordManagementModal } from './components/KeywordManagementModal'
import { openOffscreenWindowExt } from '@/lib/utils/extension'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Input } from '@repo/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import {
  TrendingUp,
  TrendingDown,
  Package,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  Calendar,
  DollarSign,
  Star,
  History,
  Settings,
  ArrowLeft,
  Loader2,
  Target,
} from 'lucide-react'

// 타입 정의
interface TrackedProductHeaderProps {
  productName: string
  customName?: string
  storeName: string
  productImage: string
  productUrl: string
  trackingKeywords: string[]
  price?: number
  originalPrice?: number
  discountRate?: number
  rating?: number
  reviewCount?: number
  categories?: string[]
  tags?: string[]
  brand?: string
  extensionId?: string
  isUpdating?: boolean
  onUpdateData?: () => void
}

interface KeywordRankingChartProps {
  keywordRankingSeries: Array<{
    keyword: string
    data: Array<{ date: string; rank: number }>
  }>
  selectedKeywords: string[]
  viewType: 'all' | 'ad' | 'organic'
}

interface KeywordRankingTableProps {
  rankingTableData: Array<{
    date: string
    keyword: string
    rank: number
    change: number
    changeType: 'up' | 'down' | 'same'
  }>
  onRowClick: (date: string, keyword: string) => void
}

interface ProductChangeHistoryProps {
  historyList: Array<{
    date: string
    type: 'name' | 'price' | 'image' | 'tags'
    before: string
    after: string
    description: string
  }>
  onHistorySelect: (history: any) => void
}

interface PriceReviewTabsProps {
  priceTrendSeries: Array<{ date: string; price: number }>
  reviewTrendSeries: Array<{ date: string; reviewCount: number; rating: number }>
  tabType: 'price' | 'review'
}

interface KeywordProductManagerProps {
  keywordList: string[]
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  productGroups: Array<{ id: string; name: string; products: string[] }>
  onGroupChange: (productId: string, groupId: string) => void
}

// 1. 상품 및 키워드 정보 헤더
function TrackedProductHeader({
  productName,
  customName,
  storeName,
  productImage,
  productUrl,
  trackingKeywords,
  price,
  originalPrice,
  discountRate,
  rating,
  reviewCount,
  categories,
  tags,
  brand,
  extensionId,
  isUpdating,
  onUpdateData,
}: TrackedProductHeaderProps) {
  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <img
            src={productImage}
            alt={productName}
            className="h-32 w-32 rounded-lg object-cover"
            onError={e => {
              if (!e.currentTarget.dataset.fallback) {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik02NCA0OEM1NS4xNjM0IDQ4IDQ4IDU1LjE2MzQgNDggNjRDNjQgNzIuODM2NiA1NS4xNjM0IDgwIDY0IDgwQzcyLjgzNjYgODAgODAgNzIuODM2NiA4MCA2NEM4MCA1NS4xNjM0IDcyLjgzNjYgNDggNjQgNDhaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik02NCAzMkM1Ni4yNjggMzIgNTAgMzguMjY4IDUwIDQ2VjU4QzUwIDY1LjczMiA1Ni4yNjggNzIgNjQgNzJINjRDNzEuNzMyIDcyIDc4IDY1LjczMiA3OCA1OFY0NkM3OCAzOC4yNjggNzEuNzMyIDMyIDY0IDMySDY0WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'
                e.currentTarget.dataset.fallback = 'true'
              }
            }}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{customName || productName}</h1>
                {customName && <p className="text-sm text-gray-500">원본명: {productName}</p>}
                <p className="text-gray-400">{storeName}</p>

                {/* 브랜드 */}
                {brand && <p className="mt-1 text-sm text-gray-300">브랜드: {brand}</p>}

                {/* 가격 정보 */}
                <div className="mt-3 flex items-center gap-3">
                  {price && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{price.toLocaleString()}원</span>
                        {originalPrice && originalPrice > price && (
                          <span className="text-lg text-gray-400 line-through">{originalPrice.toLocaleString()}원</span>
                        )}
                      </div>
                      {originalPrice && originalPrice > price && (
                        <div className="flex flex-col items-start">
                          <span className="rounded bg-red-600 px-2 py-1 text-xs text-white">{discountRate}% 할인</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 평점 및 리뷰 */}
                <div className="mt-2 flex items-center gap-4">
                  {rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="text-sm text-white">{rating}</span>
                    </div>
                  )}
                  {reviewCount && <span className="text-sm text-gray-400">리뷰 {reviewCount.toLocaleString()}개</span>}
                </div>

                {/* 카테고리 */}
                {categories && categories.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-400">카테고리: </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {categories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 태그 */}
                {tags && tags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">태그: </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="border-gray-500 text-xs text-gray-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(productUrl, '_blank')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  상품 보기
                </Button>
                {extensionId && onUpdateData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUpdateData}
                    disabled={isUpdating}
                    className="border-blue-600 text-blue-300 hover:bg-blue-700 disabled:opacity-50">
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BarChart3 className="mr-2 h-4 w-4" />
                    )}
                    {isUpdating ? '업데이트 중...' : '데이터 업데이트'}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 2. 키워드별 랭킹 차트 (기존 - 호환성을 위해 유지)
function KeywordRankingChart({ keywordRankingSeries, selectedKeywords, viewType }: KeywordRankingChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            키워드별 랭킹 추이
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 border-gray-600 bg-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7일</SelectItem>
                <SelectItem value="30d">30일</SelectItem>
                <SelectItem value="90d">90일</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewType} onValueChange={() => {}}>
              <SelectTrigger className="w-32 border-gray-600 bg-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="ad">광고</SelectItem>
                <SelectItem value="organic">자연</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-80 items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12" />
            <p>차트 컴포넌트 구현 예정</p>
            <p className="text-sm">선택된 키워드: {selectedKeywords.join(', ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 3. 키워드별 랭킹 테이블
function KeywordRankingTable({ rankingTableData, onRowClick }: KeywordRankingTableProps) {
  const getChangeIcon = (changeType: 'up' | 'down' | 'same') => {
    switch (changeType) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  const getChangeColor = (changeType: 'up' | 'down' | 'same') => {
    switch (changeType) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5" />
          랭킹 상세 테이블
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3 text-left text-sm font-medium text-gray-300">날짜</th>
                <th className="p-3 text-left text-sm font-medium text-gray-300">키워드</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">순위</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">변화</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">변동</th>
              </tr>
            </thead>
            <tbody>
              {rankingTableData.map((row, index) => (
                <tr
                  key={index}
                  className="cursor-pointer border-b border-gray-700/50 hover:bg-gray-700/50"
                  onClick={() => onRowClick(row.date, row.keyword)}>
                  <td className="p-3 text-sm text-gray-300">{row.date}</td>
                  <td className="p-3 text-sm text-white">{row.keyword}</td>
                  <td className="p-3 text-center text-sm text-white">{row.rank}위</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getChangeIcon(row.changeType)}
                      <span className={`text-sm ${getChangeColor(row.changeType)}`}>
                        {row.change > 0 ? `+${row.change}` : row.change}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Badge
                      variant="outline"
                      className={
                        row.changeType === 'up'
                          ? 'border-green-500 text-green-400'
                          : row.changeType === 'down'
                            ? 'border-red-500 text-red-400'
                            : 'border-gray-500 text-gray-400'
                      }>
                      {row.changeType === 'up' ? '상승' : row.changeType === 'down' ? '하락' : '유지'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// 4. 상품 정보 변화 이력
function ProductChangeHistory({ historyList, onHistorySelect }: ProductChangeHistoryProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'name':
        return <Package className="h-4 w-4" />
      case 'price':
        return <DollarSign className="h-4 w-4" />
      case 'image':
        return <ExternalLink className="h-4 w-4" />
      case 'tags':
        return <Search className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'name':
        return 'text-blue-400'
      case 'price':
        return 'text-green-400'
      case 'image':
        return 'text-purple-400'
      case 'tags':
        return 'text-orange-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5" />
          상품 정보 변화 이력
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historyList.map((history, index) => (
            <div
              key={index}
              className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-700/50 p-4 hover:bg-gray-700"
              onClick={() => onHistorySelect(history)}>
              <div className={`${getTypeColor(history.type)}`}>{getTypeIcon(history.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{history.date}</span>
                  <Badge variant="outline" className="border-gray-500 text-xs text-gray-300">
                    {history.type}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-white">{history.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                  <span>변경 전: {history.before}</span>
                  <span>→</span>
                  <span>변경 후: {history.after}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 5. 판매가 및 리뷰 추적 탭
function PriceReviewTabs({ priceTrendSeries, reviewTrendSeries, tabType }: PriceReviewTabsProps) {
  const [activeTab, setActiveTab] = useState<'price' | 'review'>(tabType)

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5" />
          가격 및 리뷰 추적
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'price' | 'review')}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="price" className="data-[state=active]:bg-gray-600">
              <DollarSign className="mr-2 h-4 w-4" />
              판매가
            </TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-gray-600">
              <Star className="mr-2 h-4 w-4" />
              리뷰
            </TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="mt-4">
            <div className="flex h-60 items-center justify-center text-gray-400">
              <div className="text-center">
                <DollarSign className="mx-auto mb-2 h-12 w-12" />
                <p>가격 추이 차트 구현 예정</p>
                <p className="text-sm">데이터 포인트: {priceTrendSeries.length}개</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="review" className="mt-4">
            <div className="flex h-60 items-center justify-center text-gray-400">
              <div className="text-center">
                <Star className="mx-auto mb-2 h-12 w-12" />
                <p>리뷰 추이 차트 구현 예정</p>
                <p className="text-sm">데이터 포인트: {reviewTrendSeries.length}개</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// 6. 추적 키워드 관리 컴포넌트는 별도 파일로 분리됨

// 7. 키워드·상품 관리
function KeywordProductManager({
  keywordList,
  onAddKeyword,
  onRemoveKeyword,
  productGroups,
  onGroupChange,
}: KeywordProductManagerProps) {
  const [newKeyword, setNewKeyword] = useState('')

  const handleAddKeyword = useCallback(() => {
    if (newKeyword.trim()) {
      onAddKeyword(newKeyword.trim())
      setNewKeyword('')
    }
  }, [newKeyword, onAddKeyword])

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          키워드 및 상품 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 키워드 관리 */}
        <div>
          <h3 className="mb-3 text-lg font-medium text-white">추적 키워드</h3>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="새 키워드 입력"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
            />
            <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywordList.map((keyword, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer border-blue-500 text-blue-400 hover:bg-blue-900/20">
                {keyword}
                <button onClick={() => onRemoveKeyword(keyword)} className="ml-2 text-red-400 hover:text-red-300">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* 상품 그룹 관리 */}
        <div>
          <h3 className="mb-3 text-lg font-medium text-white">상품 그룹</h3>
          <div className="space-y-2">
            {productGroups.map(group => (
              <div key={group.id} className="rounded-lg bg-gray-700/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">{group.name}</span>
                  <span className="text-sm text-gray-400">{group.products.length}개 상품</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 메인 컴포넌트
export default function RankingTraceDetailPage() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const noUpdate = searchParams.get('noUpdate') === 'true' // URL 파라미터로 업데이트 방지 여부 확인

  // 상태 관리
  const [isLoading, setIsLoading] = useState(true)
  const [productData, setProductData] = useState<
    | (TrackedProductResult & {
        rankings: Array<{
          keyword: string
          rank: number
          change: number
          changeType: string
          createdAt: Date
        }>
        changes: Array<{
          changeType: string
          beforeValue: string
          afterValue: string
          description?: string
          createdAt: Date
        }>
      })
    | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [extensionId, setExtensionId] = useState<string | null>(null)

  // 경쟁 상품 관련 상태
  const [competitorProducts, setCompetitorProducts] = useState<any[]>([])
  const [competitorTrackingData, setCompetitorTrackingData] = useState<any[]>([])
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('')
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false)

  // 자동 업데이트 실행 여부를 추적하는 ref
  const autoUpdateExecuted = useRef(false)

  // 키워드 관리 관련 상태
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false)

  // 이벤트 핸들러들 (Hook 순서 유지를 위해 최상단에 정의)
  const handleRowClick = useCallback((date: string, keyword: string) => {
    console.log('Row clicked:', { date, keyword })
  }, [])

  const handleHistorySelect = useCallback((history: any) => {
    console.log('History selected:', history)
  }, [])

  const handleGroupChange = useCallback((productId: string, groupId: string) => {
    console.log('Group change:', { productId, groupId })
  }, [])

  // 경쟁 상품 관련 핸들러
  const handleAddCompetitorProduct = useCallback(
    async (url: string) => {
      if (!extensionId) {
        console.error('확장 프로그램 ID가 없습니다.')
        return
      }

      console.log('🔄 경쟁 상품 추가 시작:', url)
      setIsAddingCompetitor(true)

      try {
        // URL 파싱 및 확장 프로그램용 파라미터 추가
        const targetUrl = new URL(url)
        const searchParams = new URLSearchParams(targetUrl.search)

        // 경쟁 상품 추가임을 알려주는 쿼리 파라미터 추가
        searchParams.set('isCompetitor', 'true')
        searchParams.set('competitorFor', productId || '')

        // 확장 프로그램용 파라미터 추가
        searchParams.set('isDev', process.env.NODE_ENV === 'development' ? 'true' : 'false')
        searchParams.set('isClose', 'false')
        searchParams.set('isToken', '1234') // 내 상품 추가와 동일한 값 사용
        searchParams.set('pagingIndex', '1')
        searchParams.set('pagingSize', '60')
        searchParams.set('sort', 'REL')
        searchParams.set('timestamp', Date.now().toString())
        searchParams.set('viewType', 'LIST')

        const searchUrl = `${targetUrl.origin}${targetUrl.pathname}?${searchParams.toString()}`
        console.log('🔍 확장 프로그램 실행 URL:', searchUrl)

        // 확장 프로그램 실행
        const result = await openOffscreenWindowExt({ extensionId, targetUrl: searchUrl })

        if (result.status === 'success') {
          console.log('✅ 확장 프로그램 실행 성공')

          // 서버에서 경쟁 상품 데이터가 업데이트되었는지 확인하여 데이터 수집 완료를 기다림
          let attempts = 0
          const maxAttempts = 5 // 10초 (2초 * 5회)
          const initialCompetitorCount = competitorProducts.length

          const checkForCompetitorUpdate = setInterval(async () => {
            attempts++
            try {
              console.log(`🔍 서버에서 경쟁 상품 데이터 확인 중... (${attempts}/${maxAttempts})`)

              // 직접 경쟁 상품 데이터를 가져와서 개수 변화 확인
              const response = await fetch(`/api/ranking-trace/competitors?productId=${productId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              })
              const result = await response.json()
              console.log('📥 경쟁 상품 데이터 응답:', result)

              if (result.status === 'success') {
                const currentCompetitorCount = result.competitors?.length || 0
                console.log(`📊 경쟁 상품 개수 변화: ${initialCompetitorCount} → ${currentCompetitorCount}`)

                if (currentCompetitorCount > initialCompetitorCount) {
                  console.log('✅ 새로운 경쟁 상품이 추가됨!')

                  // 경쟁 상품 데이터 새로고침
                  await refreshCompetitorProducts()
                  clearInterval(checkForCompetitorUpdate)
                  setIsAddingCompetitor(false)
                } else if (attempts >= maxAttempts) {
                  console.log('⏰ 경쟁 상품 추가 타임아웃 (10초)')
                  clearInterval(checkForCompetitorUpdate)
                  setIsAddingCompetitor(false)
                  alert('경쟁 상품 추가가 시간 초과되었습니다. 잠시 후 다시 시도해주세요.')
                }
              } else if (attempts >= maxAttempts) {
                console.log('⏰ 경쟁 상품 추가 타임아웃 (10초)')
                clearInterval(checkForCompetitorUpdate)
                setIsAddingCompetitor(false)
                alert('경쟁 상품 추가가 시간 초과되었습니다. 잠시 후 다시 시도해주세요.')
              }
            } catch (error) {
              console.error('서버 확인 오류:', error)
              if (attempts >= maxAttempts) {
                clearInterval(checkForCompetitorUpdate)
                setIsAddingCompetitor(false)
                alert('경쟁 상품 추가 중 오류가 발생했습니다.')
              }
            }
          }, 2000)
        } else {
          console.error('❌ 확장 프로그램 실행 실패:', result)
          setIsAddingCompetitor(false)
          alert('확장 프로그램 실행에 실패했습니다.')
        }
      } catch (error) {
        console.error('❌ 경쟁 상품 추가 오류:', error)
        setIsAddingCompetitor(false)
        alert('경쟁 상품 추가 중 오류가 발생했습니다.')
      }
    },
    [extensionId, productId],
  )

  const handleRemoveCompetitorProduct = useCallback(
    async (id: string) => {
      if (!productId) return

      try {
        console.log('🗑️ 경쟁 상품 삭제 시작:', id)
        const response = await fetch(`/api/ranking-trace/competitors?productId=${productId}&competitorId=${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        const result = await response.json()

        if (result.status === 'success') {
          setCompetitorProducts(prev => prev.filter(p => p.id !== id))
          console.log('✅ 경쟁 상품 삭제 완료:', id)
        } else {
          console.error('❌ 경쟁 상품 삭제 실패:', result.error)
        }
      } catch (error) {
        console.error('❌ 경쟁 상품 삭제 오류:', error)
      }
    },
    [productId],
  )

  const handleViewCompetitorProduct = useCallback((product: any) => {
    console.log('View competitor product:', product)
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer')
    } else {
      console.error('상품 URL이 없습니다:', product)
    }
  }, [])

  const handleSelectCompetitor = useCallback((competitorId: string) => {
    setSelectedCompetitorId(competitorId)
  }, [])

  const handleCompetitorProductSelect = useCallback((productId: string) => {
    console.log('Competitor product selected:', productId)
    // TODO: 경쟁 상품 선택 처리
  }, [])

  // 제품 이름을 파싱해서 추천 키워드 생성
  const parseProductNameToKeywords = useCallback((name: string) => {
    if (!name.trim()) return []

    // 공백으로 분리하고 특수문자 제거, 빈 문자열 필터링
    const words = name
      .split(/\s+/)
      .map(word => word.replace(/[^\w가-힣]/g, '')) // 영문, 숫자, 한글만 남김
      .filter(word => word.length > 1) // 1글자 이상만
      .filter(word => !/^\d+$/.test(word)) // 숫자만 있는 단어 제외

    return [...new Set(words)] // 중복 제거
  }, [])

  // 추천 키워드 생성 (제품 이름 기반 + 기본 추천 키워드)
  const getRecommendedKeywords = useCallback(() => {
    const productKeywords = parseProductNameToKeywords(productData?.name || '')
    const combined = [...productKeywords]
    return [...new Set(combined)] // 중복 제거
  }, [productData?.name, parseProductNameToKeywords])

  // 키워드 관리 핸들러들
  const handleOpenKeywordModal = useCallback(() => {
    setIsKeywordModalOpen(true)
  }, [])

  const handleCloseKeywordModal = useCallback(() => {
    setIsKeywordModalOpen(false)
  }, [])

  const handleSaveKeywords = useCallback(
    async (keywords: string[]) => {
      try {
        // 서버에 키워드 목록 저장
        console.log('저장할 키워드 목록:', keywords)

        const response = await fetch('/api/ranking-trace/keywords', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: productId,
            keywords: keywords,
          }),
        })

        const result = await response.json()

        if (result.status === 'success') {
          console.log('✅ 키워드 저장 성공')
          // 상품 데이터 새로고침
          const refreshResult = await getTrackedProductDetail(productId!)
          if (refreshResult.status === 'success' && refreshResult.result) {
            setProductData(refreshResult.result)
          }
        } else {
          console.error('❌ 키워드 저장 실패:', result.error)
          alert('키워드 저장에 실패했습니다: ' + result.error)
        }
      } catch (error) {
        console.error('키워드 저장 오류:', error)
        alert('키워드 저장 중 오류가 발생했습니다.')
      }
    },
    [productId],
  )

  // KeywordProductManager용 핸들러들
  const handleAddKeyword = useCallback((keyword: string) => {
    console.log('키워드 추가:', keyword)
    // TODO: 키워드 추가 로직 구현
  }, [])

  const handleRemoveKeyword = useCallback((keyword: string) => {
    console.log('키워드 제거:', keyword)
    // TODO: 키워드 제거 로직 구현
  }, [])

  // 경쟁 상품 데이터 새로고침 함수
  const refreshCompetitorProducts = useCallback(async () => {
    if (!productId) return

    try {
      console.log('🔄 경쟁 상품 데이터 새로고침 시작')
      const response = await fetch(`/api/ranking-trace/competitors?productId=${productId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const result = await response.json()

      if (result.status === 'success') {
        setCompetitorProducts(result.competitors || [])
        console.log('✅ 경쟁 상품 데이터 새로고침 완료:', result.competitors?.length || 0, '개')
      } else {
        console.error('❌ 경쟁 상품 데이터 새로고침 실패:', result.error)
        // 실패 시 빈 배열로 설정
        setCompetitorProducts([])
      }
    } catch (error) {
      console.error('❌ 경쟁 상품 데이터 새로고침 오류:', error)
      // 오류 시 빈 배열로 설정
      setCompetitorProducts([])
    }
  }, [productId])

  // 경쟁 상품 추적 데이터 새로고침 함수
  const refreshCompetitorTrackingData = useCallback(async () => {
    if (!productId) return

    try {
      console.log('🔄 경쟁 상품 추적 데이터 새로고침 시작')
      const response = await fetch(`/api/ranking-trace/competitor-tracking?productId=${productId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const result = await response.json()

      if (result.status === 'success') {
        setCompetitorTrackingData(result.trackingData || [])
        console.log('✅ 경쟁 상품 추적 데이터 새로고침 완료:', result.trackingData?.length || 0, '개')
      } else {
        console.error('❌ 경쟁 상품 추적 데이터 새로고침 실패:', result.error)
        // 실패 시 빈 배열로 설정
        setCompetitorTrackingData([])
      }
    } catch (error) {
      console.error('❌ 경쟁 상품 추적 데이터 새로고침 오류:', error)
      // 오류 시 빈 배열로 설정
      setCompetitorTrackingData([])
    }
  }, [productId])

  // 확장 프로그램을 통한 데이터 업데이트
  const handleUpdateData = useCallback(async () => {
    if (!productData?.url) {
      console.error('상품 URL이 없습니다.')
      return
    }

    setIsUpdating(true)
    console.log('🔄 상품 데이터 업데이트 시작:', productData.url)

    try {
      // 상품의 마지막 업데이트 시간 확인
      const lastUpdated = productData.updatedAt ? new Date(productData.updatedAt) : new Date(0)
      const now = new Date()
      const timeDiff = now.getTime() - lastUpdated.getTime()
      const fiveMinutesInMs = 5 * 60 * 1000 // 5분을 밀리초로 변환

      console.log('⏰ 마지막 업데이트 시간:', lastUpdated.toISOString())
      console.log('⏰ 현재 시간:', now.toISOString())
      console.log('⏰ 시간 차이:', Math.round(timeDiff / 1000), '초')

      // 5분 이내에 업데이트되었다면 확장 프로그램 실행 없이 데이터만 새로고침
      if (timeDiff < fiveMinutesInMs) {
        console.log('✅ 5분 이내에 업데이트됨 - 확장 프로그램 실행 없이 데이터 새로고침')

        const refreshResult = await getTrackedProductDetail(productId!)
        if (refreshResult.status === 'success' && refreshResult.result) {
          setProductData(refreshResult.result)
          console.log('✅ 상품 데이터 새로고침 완료')
        }

        setIsUpdating(false)
        return
      }

      // 5분 이상 지났다면 확장 프로그램 실행
      if (!extensionId) {
        console.error('확장 프로그램 ID가 없습니다.')
        setIsUpdating(false)
        return
      }

      console.log('🔄 5분 이상 지남 - 확장 프로그램 실행')

      // URL 파싱 및 확장 프로그램용 파라미터 추가
      const url = new URL(productData.url)
      const searchParams = new URLSearchParams(url.search)

      // 확장 프로그램용 파라미터 추가
      searchParams.set('isDev', process.env.NODE_ENV === 'development' ? 'true' : 'false')
      searchParams.set('isClose', 'false')
      searchParams.set('isToken', '1234') // 내 상품 추가와 동일한 값 사용
      searchParams.set('pagingIndex', '1')
      searchParams.set('pagingSize', '60')
      searchParams.set('sort', 'REL')
      searchParams.set('timestamp', Date.now().toString())
      searchParams.set('viewType', 'LIST')

      const searchUrl = `${url.origin}${url.pathname}?${searchParams.toString()}`

      // 확장 프로그램 실행
      const result = await openOffscreenWindowExt({ extensionId, targetUrl: searchUrl })

      if (result.status === 'success') {
        console.log('✅ 확장 프로그램 실행 성공')

        // 서버에서 최신 productId를 확인하여 데이터 수집 완료를 기다림
        const checkForUpdate = setInterval(async () => {
          try {
            console.log('🔍 서버에서 최신 productId 확인 중...')
            const response = await fetch('/api/ranking-trace/latest', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            })
            const result = await response.json()
            console.log('📥 서버 응답:', result)

            if (result.status === 'success' && result.productId) {
              console.log('✅ 서버에서 최신 productId 확인:', result.productId)

              // 상품 데이터 새로고침
              const refreshResult = await getTrackedProductDetail(productId!)
              if (refreshResult.status === 'success' && refreshResult.result) {
                setProductData(refreshResult.result)
                console.log('✅ 상품 데이터 업데이트 완료')
              }

              clearInterval(checkForUpdate)
              setIsUpdating(false)
            }
          } catch (error) {
            console.error('서버 확인 오류:', error)
          }
        }, 2000)
      } else {
        console.error('❌ 확장 프로그램 실행 실패:', result)
        setIsUpdating(false)
      }
    } catch (error) {
      console.error('❌ 데이터 업데이트 오류:', error)
      setIsUpdating(false)
    }
  }, [extensionId, productData?.url, productData?.updatedAt, productId])

  // 확장 프로그램 ID 가져오기
  useEffect(() => {
    const fetchExtensionId = async () => {
      try {
        const id = await getExtensionId()
        setExtensionId(id)
      } catch (error) {
        console.error('확장 프로그램 ID 가져오기 실패:', error)
      }
    }

    fetchExtensionId()
  }, [])

  // 서버에서 상품 데이터 가져오기
  useEffect(() => {
    if (!productId) {
      setError('상품 ID가 없습니다.')
      setIsLoading(false)
      return
    }

    const fetchProductData = async () => {
      try {
        const result = await getTrackedProductDetail(productId)

        if (result.status === 'success' && result.result) {
          setProductData(result.result)
        } else {
          setError(result.error || '상품 데이터를 불러오는데 실패했습니다.')
        }
        setIsLoading(false)
      } catch (err) {
        console.error('상품 데이터 로드 오류:', err)
        setError('상품 데이터를 불러오는데 실패했습니다.')
        setIsLoading(false)
      }
    }

    fetchProductData()
  }, [productId])

  // noUpdate가 false일 때 자동으로 데이터 업데이트 실행 (기본적으로 업데이트)
  // 한 번만 실행되도록 ref로 추적
  useEffect(() => {
    if (!noUpdate && extensionId && !isUpdating && productData?.id && !autoUpdateExecuted.current) {
      console.log('🔄 자동 데이터 업데이트 시작')
      autoUpdateExecuted.current = true

      // handleUpdateData를 직접 호출하지 않고 별도 함수로 분리
      const executeAutoUpdate = async () => {
        await handleUpdateData()
      }
      executeAutoUpdate()
    }
  }, [noUpdate, extensionId, isUpdating, productData?.id]) // handleUpdateData 제거

  // 경쟁 상품 데이터 초기 로드
  useEffect(() => {
    if (productId) {
      refreshCompetitorProducts()
      refreshCompetitorTrackingData()
    }
  }, [productId, refreshCompetitorProducts, refreshCompetitorTrackingData])

  // 로딩 상태 UI
  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Card className="border-gray-700 bg-gray-800">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
              <h2 className="mb-2 text-xl font-semibold text-white">상품 데이터 로딩 중</h2>
              <p className="mb-4 text-gray-400">상품 정보를 불러오고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 에러 상태 UI
  if (error) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Card className="border-red-600 bg-red-900/20">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-200">오류 발생</h2>
              <p className="text-red-100">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentProduct = {
    productName: productData?.name || '상품명 없음',
    customName: productData?.customName,
    storeName: productData?.storeName || '스토어명 없음',
    productImage: productData?.productImage || '/placeholder-product.png',
    productUrl: productData?.url || '',
    trackingKeywords: productData?.trackingKeywords || [],
    price: productData?.price,
    originalPrice: productData?.originalPrice,
    discountRate: productData?.discountRate,
    rating: productData?.rating,
    reviewCount: productData?.reviewCount,
    categories: productData?.metadata?.categories || [],
    tags: productData?.metadata?.tags || [],
    brand: productData?.metadata?.brand || productData?.metadata?.brandName,
  }

  // 실제 랭킹 데이터
  const keywordRankingSeries =
    productData?.rankings?.map((ranking: any) => ({
      keyword: ranking.keyword,
      data: [
        {
          date: ranking.createdAt
            ? typeof ranking.createdAt === 'string'
              ? ranking.createdAt
              : new Date(ranking.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          rank: ranking.rank,
        },
      ],
    })) || []

  const rankingTableData =
    productData?.rankings?.map((ranking: any) => ({
      date: ranking.createdAt
        ? typeof ranking.createdAt === 'string'
          ? ranking.createdAt
          : new Date(ranking.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      keyword: ranking.keyword,
      rank: ranking.rank,
      change: ranking.change || 0,
      changeType: ranking.changeType || 'same',
    })) || []

  // 실제 변화 이력 데이터
  const historyList =
    productData?.changes?.map((change: any) => ({
      date: change.createdAt
        ? typeof change.createdAt === 'string'
          ? change.createdAt
          : new Date(change.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      type: change.changeType,
      before: change.beforeValue,
      after: change.afterValue,
      description: change.description || '상품 정보가 변경되었습니다.',
    })) || []

  // 실제 가격/리뷰 데이터 (historyData에서 추출)
  const priceTrendSeries = productData?.historyData?.priceHistory || []
  const reviewTrendSeries = productData?.historyData?.ratingHistory || []

  // 실제 키워드 목록
  const keywordList = productData?.trackingKeywords || []

  // 실제 상품 그룹 (metadata에서 추출)
  const productGroups = (productData?.metadata?.productGroups || []).map((group: string, index: number) => ({
    id: `group-${index}`,
    name: group,
    products: [],
  }))

  // 내 상품 비교 데이터 준비
  const myProductComparisonData = {
    id: productId || '',
    name: productData?.name || '',
    price: productData?.price || 0,
    rating: productData?.rating || 0,
    reviewCount: productData?.reviewCount || 0,
    expectedSales: Math.floor((productData?.reviewCount || 0) * 0.1), // 예상 판매량 (리뷰 수의 10%)
    salesData: (productData?.historyData?.salesHistory || []).map((item: any) => ({
      date: item.date
        ? typeof item.date === 'string'
          ? item.date
          : new Date(item.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: item.value || 0,
    })),
    ratingData: (productData?.historyData?.ratingHistory || []).map((item: any) => ({
      date: item.date
        ? typeof item.date === 'string'
          ? item.date
          : new Date(item.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: item.rating || 0,
    })),
    reviewData: (productData?.historyData?.reviewHistory || []).map((item: any) => ({
      date: item.date
        ? typeof item.date === 'string'
          ? item.date
          : new Date(item.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: item.reviewCount || 0,
    })),
  }

  // 경쟁 상품 비교 데이터 준비
  const competitorComparisonData = competitorProducts.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    expectedSales: Math.floor(product.reviewCount * 0.1),
    salesData: [], // TODO: 실제 데이터로 교체
    ratingData: [], // TODO: 실제 데이터로 교체
    reviewData: [], // TODO: 실제 데이터로 교체
  }))

  // 차트 데이터 준비 - historyData 필드의 히스토리 데이터 사용
  const reviewData = (productData?.historyData?.reviewHistory || []).map((item: any) => ({
    ...item,
    date: item.date
      ? typeof item.date === 'string'
        ? item.date
        : new Date(item.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }))

  const priceData = (productData?.historyData?.priceHistory || []).map((item: any) => ({
    ...item,
    date: item.date
      ? typeof item.date === 'string'
        ? item.date
        : new Date(item.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }))

  const ratingData = (productData?.historyData?.ratingHistory || []).map((item: any) => ({
    ...item,
    date: item.date
      ? typeof item.date === 'string'
        ? item.date
        : new Date(item.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }))

  // 현재 데이터가 없으면 현재 값으로 초기 데이터 생성
  if (reviewData.length === 0 && productData?.reviewCount) {
    reviewData.push({
      date: new Date().toISOString().split('T')[0],
      reviewCount: productData.reviewCount,
      addedReviews: 0,
    })
  }

  if (priceData.length === 0 && productData?.price) {
    priceData.push({
      date: new Date().toISOString().split('T')[0],
      price: productData.price,
      originalPrice: productData.originalPrice || 0,
      discountRate: productData.discountRate || 0,
    })
  }

  if (ratingData.length === 0 && productData?.rating) {
    ratingData.push({
      date: new Date().toISOString().split('T')[0],
      rating: productData.rating,
      reviewCount: productData.reviewCount || 0,
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* 뒤로가기 버튼 및 업데이트 상태 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="border-gray-600 text-gray-300 hover:bg-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>

        {isUpdating && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-900/20 px-4 py-2 text-blue-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">데이터 업데이트 중...</span>
          </div>
        )}
      </div>

      {/* 상품 헤더 */}
      <TrackedProductHeader
        {...currentProduct}
        extensionId={extensionId}
        isUpdating={isUpdating}
        onUpdateData={handleUpdateData}
      />

      {/* 메인 탭 */}
      <Tabs defaultValue="myProduct" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="myProduct" className="data-[state=active]:bg-gray-700">
            <Package className="mr-2 h-4 w-4" />내 상품
          </TabsTrigger>
          <TabsTrigger value="competitor" className="data-[state=active]:bg-gray-700">
            <Target className="mr-2 h-4 w-4" />
            경쟁 상품
          </TabsTrigger>
        </TabsList>

        {/* 내 상품 탭 */}
        <TabsContent value="myProduct" className="space-y-6">
          {/* 추적 키워드 컴포넌트 */}
          <TrackingKeywords
            keywords={
              productData?.keywords?.map(k => ({
                id: k.id.toString(),
                keyword: k.keyword,
                market: k.market,
                createdAt: k.createdAt.toISOString(),
              })) || []
            }
            onOpenModal={handleOpenKeywordModal}
          />

          <Tabs defaultValue="ranking" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="ranking" className="data-[state=active]:bg-gray-700">
                <BarChart3 className="mr-2 h-4 w-4" />
                랭킹 분석
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
                <History className="mr-2 h-4 w-4" />
                변화 이력
              </TabsTrigger>
              <TabsTrigger value="price" className="data-[state=active]:bg-gray-700">
                <DollarSign className="mr-2 h-4 w-4" />
                가격/리뷰
              </TabsTrigger>
              <TabsTrigger value="manage" className="data-[state=active]:bg-gray-700">
                <Settings className="mr-2 h-4 w-4" />
                관리
              </TabsTrigger>
            </TabsList>

            {/* 랭킹 분석 탭 */}
            <TabsContent value="ranking" className="space-y-6">
              <KeywordRankingCharts reviewData={reviewData} priceData={priceData} ratingData={ratingData} />
              <KeywordRankingTable rankingTableData={rankingTableData} onRowClick={handleRowClick} />
            </TabsContent>

            {/* 변화 이력 탭 */}
            <TabsContent value="history" className="space-y-6">
              <ProductChangeHistory historyList={historyList} onHistorySelect={handleHistorySelect} />
            </TabsContent>

            {/* 가격/리뷰 탭 */}
            <TabsContent value="price" className="space-y-6">
              <PriceReviewTabs
                priceTrendSeries={priceTrendSeries}
                reviewTrendSeries={reviewTrendSeries}
                tabType="price"
              />
            </TabsContent>

            {/* 관리 탭 */}
            <TabsContent value="manage" className="space-y-6">
              <KeywordProductManager
                keywordList={keywordList}
                onAddKeyword={handleAddKeyword}
                onRemoveKeyword={handleRemoveKeyword}
                productGroups={productGroups}
                onGroupChange={handleGroupChange}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 경쟁 상품 탭 */}
        <TabsContent value="competitor" className="space-y-6">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="list" className="data-[state=active]:bg-gray-700">
                <Plus className="mr-2 h-4 w-4" />
                상품 추가
              </TabsTrigger>
              <TabsTrigger value="tracking" className="data-[state=active]:bg-gray-700">
                <BarChart3 className="mr-2 h-4 w-4" />
                추적 분석
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-gray-700">
                <Target className="mr-2 h-4 w-4" />
                비교 분석
              </TabsTrigger>
            </TabsList>

            {/* 경쟁 상품 리스트 탭 */}
            <TabsContent value="list" className="space-y-6">
              <CompetitorProductList
                products={competitorProducts}
                onAddProduct={handleAddCompetitorProduct}
                onRemoveProduct={handleRemoveCompetitorProduct}
                onViewProduct={handleViewCompetitorProduct}
                isLoading={isAddingCompetitor}
              />
            </TabsContent>

            {/* 경쟁 상품 추적 탭 */}
            <TabsContent value="tracking" className="space-y-6">
              <CompetitorTrackingTable data={competitorTrackingData} onProductSelect={handleCompetitorProductSelect} />
            </TabsContent>

            {/* 경쟁 상품 비교 분석 탭 */}
            <TabsContent value="comparison" className="space-y-6">
              <CompetitorComparison
                myProduct={myProductComparisonData}
                competitorProducts={competitorComparisonData}
                onSelectCompetitor={handleSelectCompetitor}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* 키워드 관리 모달 */}
      <KeywordManagementModal
        isOpen={isKeywordModalOpen}
        onClose={handleCloseKeywordModal}
        onSave={handleSaveKeywords}
        currentKeywords={productData?.keywords?.map(k => k.keyword) || []}
        recommendedKeywords={getRecommendedKeywords()}
      />
    </div>
  )
}
