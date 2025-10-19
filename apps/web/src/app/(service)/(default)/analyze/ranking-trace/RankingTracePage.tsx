'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Input } from '@repo/ui/components/input'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Package,
  Plus,
  Trash2,
  Eye,
  ArrowUpDown,
  ShoppingCart,
  BarChart3,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import {
  openOffscreenWindowExt,
  getLatestProductIdFromExtension,
  clearLatestProductIdFromExtension,
} from '@/lib/utils/extension'
import { getTrackedProducts, deleteTrackedProduct } from './trackedProductServerAction'
import TrackedProductItem from './components/TrackedProductItem'

// 마켓 타입
type MarketType = 'naver' | 'coupang'

// 정렬 타입
type SortType = 'default' | 'recent' | 'change'

// 추적 상품 인터페이스
interface TrackedProduct {
  id: string
  userTrackedProductId?: string
  name: string
  url: string
  market: MarketType
  currentRank?: number
  previousRank?: number
  rankChange?: number
  addedAt: string
  lastChecked?: string
}

// 샘플 데이터
const sampleProducts: TrackedProduct[] = [
  {
    id: 'sample-1',
    name: '아이폰 15 Pro 케이스',
    url: 'https://smartstore.naver.com/sample/products/123',
    market: 'naver',
    currentRank: 3,
    previousRank: 5,
    rankChange: 2,
    addedAt: '2024-01-15',
    lastChecked: '2024-01-16',
  },
  {
    id: 'sample-2',
    name: '갤럭시 S24 Ultra 보호필름',
    url: 'https://www.coupang.com/vp/products/456',
    market: 'coupang',
    currentRank: 8,
    previousRank: 12,
    rankChange: 4,
    addedAt: '2024-01-14',
    lastChecked: '2024-01-16',
  },
]

interface RankingTracePageProps {
  extensionId: string
}

export default function RankingTracePage({ extensionId }: RankingTracePageProps) {
  const router = useRouter()

  // 상태 관리
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('naver')
  const [sortType, setSortType] = useState<SortType>('default')

  // 추적 데이터
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  // 입력 폼 상태
  const [newProductUrl, setNewProductUrl] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // 확장 프로그램 상태
  const [isExtensionOpen, setIsExtensionOpen] = useState(false)
  const [isCollectingData, setIsCollectingData] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  // 최근 상품 ID 조회 (확장 프로그램이 데이터를 처리한 후)
  const { data: latestProductId, isLoading: isCheckingLatestProduct } = useQuery({
    queryKey: ['latest-product-id'],
    queryFn: async () => {
      const response = await fetch('/api/ranking-trace/latest', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const result = await response.json()
      if (result.status === 'success' && result.productId) {
        return result.productId
      }
      throw new Error(result.error || '상품 ID를 찾을 수 없습니다.')
    },
    enabled: isEnabled, // isEnabled가 true일 때만 실행
    retry: 5, // 5번 재시도 (10초간) - fallback용
    retryDelay: 2000, // 2초마다 재시도
    refetchInterval: 2000, // 2초마다 자동 재조회
    refetchIntervalInBackground: false,
    staleTime: 0,
  })

  // 실제 추적 상품들 가져오기
  useEffect(() => {
    const fetchTrackedProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const result = await getTrackedProducts()
        if (result.status === 'success' && result.result) {
          // 서버 데이터를 TrackedProduct 형식으로 변환
          const convertedProducts: TrackedProduct[] = result.result.map(product => ({
            id: product.id,
            userTrackedProductId: product.userTrackedProductId,
            name: product.name,
            url: product.url,
            market: product.market as MarketType,
            currentRank: product.latestRankings[0]?.rank,
            previousRank: product.latestRankings[0]?.rank
              ? product.latestRankings[0].rank - product.latestRankings[0].change
              : undefined,
            rankChange: product.latestRankings[0]?.change,
            addedAt: product.createdAt.toISOString().split('T')[0],
            lastChecked: product.updatedAt.toISOString().split('T')[0],
          }))

          // 실제 데이터와 샘플 데이터를 합쳐서 표시
          const allProducts = [...sampleProducts, ...convertedProducts]
          setTrackedProducts(allProducts)
        } else {
          // 실패 시 샘플 데이터만 표시
          setTrackedProducts(sampleProducts)
        }
      } catch (error) {
        console.error('추적 상품 조회 오류:', error)
        // 오류 시 샘플 데이터만 표시
        setTrackedProducts(sampleProducts)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchTrackedProducts()
  }, [])

  // 확장 프로그램 스토리지에서 productId를 주기적으로 확인
  useEffect(() => {
    if (!isEnabled || !extensionId) return

    console.log('🔍 확장 프로그램 스토리지에서 productId 확인 시작')

    const checkInterval = setInterval(async () => {
      try {
        const result = await getLatestProductIdFromExtension({ extensionId })

        if (result.status === 'success' && result.productId) {
          console.log('✅ 확장 프로그램에서 전달받은 상품 ID:', result.productId)

          // 상품 목록 새로고침
          const refreshProducts = async () => {
            try {
              const refreshResult = await getTrackedProducts()
              if (refreshResult.status === 'success' && refreshResult.result) {
                const convertedProducts: TrackedProduct[] = refreshResult.result.map(product => ({
                  id: product.id,
                  name: product.name,
                  url: product.url,
                  market: product.market as MarketType,
                  currentRank: product.latestRankings[0]?.rank,
                  previousRank: product.latestRankings[0]?.rank
                    ? product.latestRankings[0].rank - product.latestRankings[0].change
                    : undefined,
                  rankChange: product.latestRankings[0]?.change,
                  addedAt: product.createdAt.toISOString().split('T')[0],
                  lastChecked: product.updatedAt.toISOString().split('T')[0],
                }))
                setTrackedProducts([...sampleProducts, ...convertedProducts])
              }
            } catch (error) {
              console.error('상품 목록 새로고침 오류:', error)
            }
          }

          await refreshProducts()

          // 확장 프로그램 스토리지에서 productId 삭제
          await clearLatestProductIdFromExtension({ extensionId })

          // 상세 페이지로 이동 (업데이트 없이 - addProduct에서만)
          router.push(`/analyze/ranking-trace/detail?productId=${result.productId}&noUpdate=true`)

          // 상태 초기화
          setIsCollectingData(false)
          setIsExtensionOpen(false)
          setNewProductUrl('')
          setShowAddForm(false)
          setIsEnabled(false)

          // 인터벌 정리
          clearInterval(checkInterval)
        }
      } catch (error) {
        console.error('확장 프로그램 스토리지 확인 오류:', error)
      }
    }, 2000) // 2초마다 확인

    // 30초 타임아웃 설정
    const timeout = setTimeout(() => {
      clearInterval(checkInterval)
      setIsEnabled(false)
      setIsCollectingData(false)
      console.warn('⏰ productId 확인 타임아웃 (30초)')
    }, 30000)

    return () => {
      clearInterval(checkInterval)
      clearTimeout(timeout)
    }
  }, [isEnabled, extensionId, router])

  // 최근 상품 ID가 조회되면 상세 페이지로 이동 (fallback)
  useEffect(() => {
    if (latestProductId) {
      console.log('✅ 최근 생성된 TrackedProduct ID (fallback):', latestProductId)

      // 상품 목록 새로고침
      const refreshProducts = async () => {
        try {
          const refreshResult = await getTrackedProducts()
          if (refreshResult.status === 'success' && refreshResult.result) {
            const convertedProducts: TrackedProduct[] = refreshResult.result.map(product => ({
              id: product.id,
              name: product.name,
              url: product.url,
              market: product.market as MarketType,
              currentRank: product.latestRankings[0]?.rank,
              previousRank: product.latestRankings[0]?.rank
                ? product.latestRankings[0].rank - product.latestRankings[0].change
                : undefined,
              rankChange: product.latestRankings[0]?.change,
              addedAt: product.createdAt.toISOString().split('T')[0],
              lastChecked: product.updatedAt.toISOString().split('T')[0],
            }))
            setTrackedProducts([...sampleProducts, ...convertedProducts])
          }
        } catch (error) {
          console.error('상품 목록 새로고침 오류:', error)
        }
      }

      refreshProducts()
      router.push(`/analyze/ranking-trace/detail?productId=${latestProductId}`)

      // 상태 초기화
      setIsCollectingData(false)
      setIsExtensionOpen(false)
      setNewProductUrl('')
      setShowAddForm(false)
      setIsEnabled(false)
    }
  }, [latestProductId, router])

  // URL에서 불필요한 query parameter 제거 및 마켓 감지 함수
  const getSearchUrl = useCallback(
    (inputUrl: string) => {
      const isDev = process.env.NODE_ENV === 'development'

      // URL이 이미 완전한 URL인 경우
      if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
        try {
          const url = new URL(inputUrl)

          // 네이버쇼핑 URL인 경우
          if (
            url.hostname.includes('smartstore.naver.com') ||
            url.hostname.includes('shopping.naver.com') ||
            url.hostname.includes('brand.naver.com')
          ) {
            // 기존 쿼리 파라미터 유지하고 확장 프로그램용 파라미터 추가
            const finalUrl = new URL(url.toString())

            // 기존 query 파라미터가 있으면 유지, 없으면 빈 문자열로 설정
            if (!finalUrl.searchParams.has('query')) {
              finalUrl.searchParams.set('query', '')
            }

            finalUrl.searchParams.set('isToken', '1234')
            finalUrl.searchParams.set('pagingIndex', '1')
            finalUrl.searchParams.set('pagingSize', '80')
            finalUrl.searchParams.set('sort', 'rel')
            finalUrl.searchParams.set('timestamp', '')
            finalUrl.searchParams.set('viewType', 'list')

            if (isDev) {
              finalUrl.searchParams.set('isClose', (!isDev).toString())
              finalUrl.searchParams.set('isDev', 'true')
            }

            return { url: finalUrl.toString(), market: 'naver' as MarketType }
          }

          // 쿠팡 URL인 경우
          if (url.hostname.includes('coupang.com')) {
            // 불필요한 query parameter들 제거하고 확장 프로그램용 파라미터 추가
            const cleanUrl = `${url.protocol}//${url.hostname}${url.pathname}`
            const finalUrl = new URL(cleanUrl)
            finalUrl.searchParams.set('query', '')
            finalUrl.searchParams.set('isToken', '1234')
            finalUrl.searchParams.set('pagingIndex', '1')
            finalUrl.searchParams.set('pagingSize', '80')
            finalUrl.searchParams.set('sort', 'rel')
            finalUrl.searchParams.set('timestamp', '')
            finalUrl.searchParams.set('viewType', 'list')

            if (isDev) {
              finalUrl.searchParams.set('isClose', (!isDev).toString())
              finalUrl.searchParams.set('isDev', 'true')
            }

            return { url: finalUrl.toString(), market: 'coupang' as MarketType }
          }

          // 기타 URL인 경우 그대로 반환
          return { url: inputUrl, market: 'naver' as MarketType }
        } catch (error) {
          console.error('URL 파싱 오류:', error)
          return { url: inputUrl, market: 'naver' as MarketType }
        }
      }

      // URL이 아닌 경우 (키워드나 상품명) - 선택된 마켓으로 검색 URL 생성
      if (selectedMarket === 'naver') {
        const searchUrl = new URL('https://search.shopping.naver.com/search/all')
        searchUrl.searchParams.set('query', inputUrl)
        searchUrl.searchParams.set('isToken', '1234')
        searchUrl.searchParams.set('pagingIndex', '1')
        searchUrl.searchParams.set('pagingSize', '80')
        searchUrl.searchParams.set('sort', 'rel')
        searchUrl.searchParams.set('timestamp', '')
        searchUrl.searchParams.set('viewType', 'list')

        if (isDev) {
          searchUrl.searchParams.set('isClose', (!isDev).toString())
          searchUrl.searchParams.set('isDev', 'true')
        }

        return {
          url: searchUrl.toString(),
          market: 'naver' as MarketType,
        }
      } else if (selectedMarket === 'coupang') {
        const searchUrl = new URL('https://www.coupang.com/np/search')
        searchUrl.searchParams.set('q', inputUrl)
        searchUrl.searchParams.set('isToken', '1234')
        searchUrl.searchParams.set('pagingIndex', '1')
        searchUrl.searchParams.set('pagingSize', '80')
        searchUrl.searchParams.set('sort', 'rel')
        searchUrl.searchParams.set('timestamp', '')
        searchUrl.searchParams.set('viewType', 'list')

        if (isDev) {
          searchUrl.searchParams.set('isClose', (!isDev).toString())
          searchUrl.searchParams.set('isDev', 'true')
        }

        return {
          url: searchUrl.toString(),
          market: 'coupang' as MarketType,
        }
      }

      // 기본값
      const searchUrl = new URL('https://search.shopping.naver.com/search/all')
      searchUrl.searchParams.set('query', inputUrl)
      searchUrl.searchParams.set('isToken', '1234')
      searchUrl.searchParams.set('pagingIndex', '1')
      searchUrl.searchParams.set('pagingSize', '80')
      searchUrl.searchParams.set('sort', 'rel')
      searchUrl.searchParams.set('timestamp', '')
      searchUrl.searchParams.set('viewType', 'list')

      if (isDev) {
        searchUrl.searchParams.set('isClose', (!isDev).toString())
        searchUrl.searchParams.set('isDev', 'true')
      }

      return {
        url: searchUrl.toString(),
        market: 'naver' as MarketType,
      }
    },
    [selectedMarket],
  )

  // 상품 추가 (확장 프로그램 사용)
  const handleAddProduct = useCallback(async () => {
    if (!newProductUrl.trim()) return

    try {
      setIsCollectingData(true)
      setIsExtensionOpen(true)

      // URL에서 마켓 파싱 및 검색 URL 생성
      const { url: searchUrl, market: detectedMarket } = getSearchUrl(newProductUrl.trim())
      console.log('🔍 검색 URL:', searchUrl)
      console.log('🏪 감지된 마켓:', detectedMarket)

      // 확장 프로그램 열기
      openOffscreenWindowExt({
        extensionId,
        targetUrl: searchUrl,
      }).then(res => {
        if (res.status === 'success') {
          console.log('✅ 확장 프로그램이 성공적으로 실행되었습니다.')
          // useQuery가 활성화되어 최근 상품 ID 조회 시작
          setIsEnabled(true)
          setIsCollectingData(false)
          setIsExtensionOpen(false)
        } else {
          console.error('❌ 확장 프로그램 실행 실패')
          alert('확장 프로그램이 설치되지 않았거나 활성화되지 않았습니다.')
          setIsCollectingData(false)
          setIsExtensionOpen(false)
        }
      })
    } catch (error) {
      console.error('확장 프로그램 실행 오류:', error)
      alert('Extension is not installed. Please install the extension first.')
      setIsCollectingData(false)
      setIsExtensionOpen(false)
    }
  }, [newProductUrl, extensionId, getSearchUrl])

  // 상품 삭제
  const handleDeleteProduct = useCallback(async (id: string) => {
    // 샘플 데이터는 삭제하지 않음
    if (id.startsWith('sample-')) {
      alert('샘플 데이터는 삭제할 수 없습니다.')
      return
    }

    try {
      const result = await deleteTrackedProduct(id)
      if (result.status === 'success') {
        // 클라이언트 데이터에서도 제거
        setTrackedProducts(prev => prev.filter(p => p.id !== id))
        alert('상품이 삭제되었습니다.')
      } else {
        alert('삭제에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }, [])

  // 랭킹 변화 표시 컴포넌트
  const RankChangeIndicator = ({ change }: { change?: number }) => {
    if (!change) return <span className="text-gray-400">-</span>

    if (change > 0) {
      return (
        <span className="flex items-center gap-1 text-green-400">
          <TrendingUp className="h-3 w-3" />+{change}
        </span>
      )
    } else if (change < 0) {
      return (
        <span className="flex items-center gap-1 text-red-400">
          <TrendingUp className="h-3 w-3 rotate-180" />
          {change}
        </span>
      )
    }

    return <span className="text-gray-400">-</span>
  }

  // 마켓 아이콘
  const MarketIcon = ({ market }: { market: MarketType }) => {
    if (market === 'naver') {
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded bg-green-600 text-xs font-bold text-white">
          N
        </div>
      )
    }
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">C</div>
    )
  }

  // 정렬된 데이터
  const sortedProducts = [...trackedProducts].sort((a, b) => {
    switch (sortType) {
      case 'recent':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      case 'change':
        return (b.rankChange || 0) - (a.rankChange || 0)
      default:
        return 0
    }
  })

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* 상단 설정 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 마켓 선택 */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <ShoppingCart className="h-4 w-4" />
              지원 마켓
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={selectedMarket} onValueChange={(value: MarketType) => setSelectedMarket(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naver">네이버쇼핑</SelectItem>
                <SelectItem value="coupang">쿠팡</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* 정렬 기준 */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <ArrowUpDown className="h-4 w-4" />
              정렬 기준
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">기본순</SelectItem>
                <SelectItem value="recent">최근 추가순</SelectItem>
                <SelectItem value="change">오늘 변동순</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* 통계 */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <BarChart3 className="h-4 w-4" />
              추적 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>상품:</span>
                <span>{trackedProducts.length}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 컨텐츠 */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                일간 랭킹 추적
              </CardTitle>
              <CardDescription className="text-gray-400">상품의 랭킹 변화를 추적하고 분석합니다</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              상품 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 추가 폼 */}
          {showAddForm && (
            <div className="mt-4 rounded-lg border border-gray-600 bg-gray-700 p-4">
              <h3 className="mb-3 text-sm font-medium text-white">새 상품 추가</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="상품 URL을 입력하세요..."
                  value={newProductUrl}
                  onChange={e => setNewProductUrl(e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white"
                />
                <Button onClick={handleAddProduct} disabled={!newProductUrl.trim() || isCollectingData}>
                  {isCollectingData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      수집 중...
                    </>
                  ) : (
                    '추가'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  취소
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-400">
                  네이버쇼핑 또는 쿠팡 상품 URL을 입력하세요. 불필요한 추적 파라미터는 자동으로 제거됩니다.
                </p>
                <p className="text-xs text-gray-500">
                  • 상품 URL: https://smartstore.naver.com/products/123456 → 깔끔한 URL로 변환
                  <br />• 키워드/상품명: 선택된 마켓에서 검색합니다
                </p>
                {isCollectingData && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-900/20 p-2 text-xs text-blue-200">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>확장 프로그램에서 랭킹 데이터를 수집 중입니다...</span>
                  </div>
                )}
                {isExtensionOpen && !isCollectingData && (
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-900/20 p-2 text-xs text-yellow-200">
                    <Package className="h-3 w-3" />
                    <span>확장 프로그램이 열렸습니다. 상품 페이지에서 데이터를 수집해주세요.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 상품 추적 */}
          <div className="mt-6 space-y-4">
            {isLoadingProducts || isCheckingLatestProduct ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-300">추적 상품을 불러오는 중...</h3>
                <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
              </div>
            ) : trackedProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-300">추적 중인 상품이 없습니다</h3>
                <p className="mb-4 text-sm text-gray-500">상품을 추가하여 일간 랭킹 변화를 추적해보세요</p>
                <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />첫 번째 상품 추가
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedProducts.map(product => (
                  <TrackedProductItem key={product.id} product={product} onDelete={handleDeleteProduct} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 크롬 확장 프로그램 안내 */}
      <Card className="border-yellow-600 bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-200">
            <Package className="h-5 w-5" />
            크롬 확장 프로그램 필요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-yellow-100">
            <p>실시간 랭킹 데이터 수집을 위해서는 크롬 확장 프로그램이 필요합니다.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                <span>네이버쇼핑과 쿠팡의 검색 결과 페이지에서 랭킹 데이터 자동 수집</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                <span>상품별 순위 변화 추적 및 알림</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                <span>키워드별 검색 결과 순위 모니터링</span>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" className="border-yellow-600 text-yellow-200 hover:bg-yellow-900/40">
                확장 프로그램 설치 (준비 중)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용법 안내 */}
      <Card className="border-blue-600 bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-200">
            <Eye className="h-5 w-5" />
            사용법 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-100">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-200">상품 추적</h4>
              <div className="ml-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                    1
                  </span>
                  <span>추적할 상품의 URL을 복사합니다</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                    2
                  </span>
                  <span>"상품 추가" 버튼을 클릭하여 URL을 입력합니다</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                    3
                  </span>
                  <span>일간 랭킹 변화를 자동으로 추적합니다</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
