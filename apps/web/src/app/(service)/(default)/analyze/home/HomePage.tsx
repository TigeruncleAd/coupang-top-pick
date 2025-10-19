/* eslint-disable @next/next/no-img-element */
'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { useState, useCallback, useEffect } from 'react'
import {
  TrendingUp,
  Star,
  BarChart3,
  Zap,
  Target,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Package,
  ExternalLink,
} from 'lucide-react'
import { checkTrendDataExists, getTrendData } from '@/serverActions/analyze/trend-data.actions'
import { getBestProducts, type BestProduct } from '@/serverActions/analyze/best-products.actions'
import CategoryTabs from '../(_components)/CategoryTabs'

interface TrendKeyword {
  rank: number
  keyword: string
  category: string
  trend: 'up' | 'down' | 'stable' | 'new' | 'keep' | 'jump'
  trendText: string
  changeValue?: number
  searchVolume?: number
  competitionScore?: number
  relatedProducts: any[]
}

interface TrendData {
  keywords: TrendKeyword[]
  category: string
  period: string
  totalCount: number
  lastUpdated: string
}

interface BestProductsData {
  categoryName: string
  products: BestProduct[]
  totalProducts: number
  collectedAt: string
}

export default function HomePage() {
  // 상태 관리
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('전체')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('daily')
  const [isLoading, setIsLoading] = useState(false)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [bestProductsData, setBestProductsData] = useState<BestProductsData | null>(null)
  const [dataExists, setDataExists] = useState<{ exists: boolean; lastUpdated?: Date }>({
    exists: false,
  })
  const [error, setError] = useState<string | null>(null)

  // 카테고리 선택 핸들러
  const handleCategoryChange = useCallback((categoryId: string | null, categoryName: string) => {
    // categoryId가 null이거나 'all'인 경우 "전체"로 처리
    const finalCategoryName = categoryId === null || categoryId === 'all' ? '전체' : categoryName
    setSelectedCategoryName(finalCategoryName)
    // 데이터 초기화는 useEffect에서 처리
  }, [])

  // 기간 탭 변경 핸들러
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as 'daily' | 'weekly')
  }

  // 베스트 상품 데이터 로드
  const fetchBestProductsData = async (categoryName: string, period?: 'daily' | 'weekly') => {
    if (!categoryName) return

    try {
      const periodType = (period || selectedPeriod) === 'weekly' ? 'WEEKLY' : 'DAILY'
      const result = await getBestProducts(categoryName, periodType)

      if (result.success && result.data) {
        setBestProductsData(result.data)
      } else {
        setBestProductsData(null)
      }
    } catch (err) {
      console.error('베스트 상품 데이터 로드 실패:', err)
      setBestProductsData(null)
    }
  }

  // 특정 카테고리의 트렌드 데이터 수집
  const fetchTrendDataForCategory = async (categoryName: string, period?: 'daily' | 'weekly') => {
    if (!categoryName) return

    setIsLoading(true)
    setError(null)

    // periodType 매핑 (파라미터로 받은 period 우선, 없으면 현재 상태 사용)
    const currentPeriod = period || selectedPeriod
    const periodType = currentPeriod === 'weekly' ? 'WEEKLY' : 'DAILY'

    try {
      // 1. 기존 데이터 확인
      const checkResult = await checkTrendDataExists(categoryName, periodType)

      if (checkResult.exists) {
        // 기존 데이터가 있으면 조회
        console.log('📊 기존 트렌드 데이터 사용')
        const dataResult = await getTrendData(categoryName, periodType)

        if (dataResult.success && dataResult.data) {
          const transformedData: TrendData = {
            category: dataResult.data.categoryName,
            period: currentPeriod === 'daily' ? '일간' : '주간',
            keywords: dataResult.data.keywords,
            totalCount: dataResult.data.totalKeywords,
            lastUpdated: dataResult.data.collectedAt || new Date().toISOString(),
          }
          setTrendData(transformedData)
          setDataExists({ exists: true, lastUpdated: checkResult.lastUpdated })
        }
      } else {
        // 기존 데이터가 없으면 에러 메시지 표시
        setError('해당 카테고리의 트렌드 데이터가 없습니다. 데이터 관리 페이지에서 데이터를 수집해주세요.')
        setTrendData(null)
        setDataExists({ exists: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 수동으로 트렌드 데이터 새로고침
  const handleFetchTrendData = async () => {
    if (!selectedCategoryName) return
    await fetchTrendDataForCategory(selectedCategoryName, selectedPeriod)
  }

  // 카테고리나 기간이 변경될 때마다 데이터 페칭
  useEffect(() => {
    if (selectedCategoryName) {
      // 데이터 초기화
      setTrendData(null)
      setBestProductsData(null)
      setDataExists({ exists: false })
      setError(null)

      // 데이터 페칭
      fetchTrendDataForCategory(selectedCategoryName, selectedPeriod)
      fetchBestProductsData(selectedCategoryName, selectedPeriod)
    }
  }, [selectedCategoryName, selectedPeriod]) // 카테고리나 기간 변경 시 실행

  // 트렌드 아이콘 렌더링 - 다크 모드 대응
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-red-400 dark:text-red-300" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-blue-400 dark:text-blue-300" />
      case 'new':
        return <Star className="h-4 w-4 text-yellow-400 dark:text-yellow-300" />
      case 'jump':
        return <Zap className="h-4 w-4 text-purple-400 dark:text-purple-300" />
      default:
        return <Minus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
  }

  // 베스트 상품 카드 렌더링 - 아이템스카우트 스타일
  const renderBestProductCard = (product: BestProduct) => {
    const handleCardClick = () => {
      console.log('🖱️ 상품 카드 클릭:', {
        title: product.title,
        productUrl: product.productUrl,
        hasUrl: !!product.productUrl,
      })

      if (product.productUrl) {
        window.open(product.productUrl, '_blank')
      } else {
        console.warn('⚠️ 상품 URL이 없습니다:', product)
        alert('상품 링크를 찾을 수 없습니다.')
      }
    }

    return (
      <Card
        key={product.rank}
        className={`group border-gray-700 bg-gray-800 transition-all hover:scale-105 hover:shadow-lg ${
          product.productUrl ? 'cursor-pointer' : ''
        }`}
        onClick={product.productUrl ? handleCardClick : undefined}>
        <CardContent className="p-3">
          <div className="space-y-3">
            {/* 상품 이미지와 순위 */}
            <div className="relative">
              {product.imageUrl ? (
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="flex hidden h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
              {/* 순위 배지 */}
              <div className="absolute -left-2 -top-2">
                <Badge
                  className={`h-6 w-6 rounded-full p-0 text-xs font-bold text-white shadow-lg ${
                    product.rank === 1
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700'
                      : product.rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600'
                        : product.rank === 3
                          ? 'bg-gradient-to-br from-amber-600 to-amber-800 dark:from-amber-500 dark:to-amber-700'
                          : 'bg-blue-600 dark:bg-blue-500'
                  }`}>
                  {product.rank}
                </Badge>
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="space-y-2">
              {/* 상품명 */}
              <h3 className="line-clamp-2 text-sm font-medium leading-tight text-gray-900 group-hover:text-blue-500 dark:text-white dark:group-hover:text-blue-400">
                {product.title}
              </h3>

              {/* 브랜드 */}
              {product.brand && <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>}

              {/* 가격 정보 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {(product.price || 0).toLocaleString()}원
                  </span>
                  {product.originalPrice && product.discountRate && (
                    <Badge
                      variant="destructive"
                      className="bg-red-100 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {product.discountRate}% 할인
                    </Badge>
                  )}
                </div>
                {product.originalPrice && (
                  <span className="text-xs text-gray-500 line-through dark:text-gray-400">
                    {(product.originalPrice || 0).toLocaleString()}원
                  </span>
                )}
              </div>

              {/* 평점 및 리뷰 */}
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating}</span>
                </div>
                <span>
                  리뷰 {(product.reviewCount || 0).toLocaleString() + ((product.reviewCount || 0) >= 99999 ? '+' : '')}
                  개
                </span>
              </div>

              {/* 상품 링크 - 클릭 가능한 경우에만 표시 */}
              {product.productUrl && (
                <div className="flex items-center justify-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                  <ExternalLink className="h-3 w-3" />
                  <span>클릭하여 상품 보기</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 트렌드 배지 렌더링
  const renderTrendBadge = (trend: string, trendText: string) => {
    const getVariant = (trend: string) => {
      switch (trend) {
        case 'up':
          return 'default'
        case 'down':
          return 'destructive'
        case 'new':
          return 'secondary'
        case 'jump':
          return 'outline'
        default:
          return 'secondary'
      }
    }

    return (
      <Badge
        variant={getVariant(trend)}
        className={`flex items-center gap-1 ${
          trend === 'up'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : trend === 'down'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : trend === 'new'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : trend === 'jump'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}>
        {renderTrendIcon(trend)}
        {trendText}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen space-y-4 p-4">
      {/* 카테고리 선택 */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5" />
            트렌드 분석 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 카테고리 선택 */}
            <CategoryTabs onCategoryChange={handleCategoryChange} selectedCategoryName={selectedCategoryName} />

            {/* 기간 선택 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-200">기간:</span>
              <Tabs value={selectedPeriod} onValueChange={handlePeriodChange}>
                <TabsList className="bg-gray-700">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-gray-600">
                    일간
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-gray-600">
                    주간
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 데이터 수집 버튼 */}
            <div className="flex items-center gap-2">
              <Button onClick={handleFetchTrendData} disabled={isLoading} className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    데이터 수집 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    새로고침
                  </>
                )}
              </Button>

              {dataExists.exists && (
                <Badge variant="outline" className="border-green-400 text-green-400">
                  <Clock className="mr-1 h-3 w-3" />
                  최근 업데이트: {dataExists.lastUpdated?.toLocaleString()}
                </Badge>
              )}
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div className="rounded-lg border border-red-500 bg-red-900/20 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                  <h4 className="text-sm font-medium text-red-200">⚠️ 트렌드 데이터 수집 오류</h4>
                </div>
                <p className="mt-2 text-sm text-red-300">{error}</p>
                <p className="mt-1 text-xs text-red-400">
                  잠시 후 다시 시도해주세요. 서비스가 일시적으로 불안정할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 메인 콘텐츠 - 아이템스카우트 스타일 */}
      {(trendData || bestProductsData) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 키워드 섹션 - 좁은 너비 */}
          {trendData && (
            <div className="lg:col-span-1">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">키워드 Best</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {trendData.totalCount}개
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">네이버쇼핑에서 많이 검색된 키워드입니다.</p>
                </CardHeader>
                <CardContent>
                  {trendData.keywords.length === 0 ? (
                    <div className="py-8 text-center">
                      <BarChart3 className="mx-auto mb-4 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-400">트렌드 데이터가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trendData.keywords.slice(0, 20).map((keyword, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg bg-gray-700/30 p-3 transition-colors hover:bg-gray-700/50">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              keyword.rank === 1
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700'
                                : keyword.rank === 2
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600'
                                  : keyword.rank === 3
                                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 dark:from-amber-500 dark:to-amber-700'
                                    : 'bg-blue-600 dark:bg-blue-500'
                            }`}>
                            {keyword.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-white">{keyword.keyword}</h3>
                          </div>
                          <div className="flex-shrink-0">{renderTrendBadge(keyword.trend, keyword.trendText)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 베스트 상품 섹션 - 넓은 너비 */}
          {bestProductsData && (
            <div className="lg:col-span-2">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg text-white">판매량 Best</CardTitle>
                  </div>
                  <p className="text-sm text-gray-400">네이버쇼핑에서 판매량이 높았던 상품들입니다.</p>
                </CardHeader>
                <CardContent>
                  {bestProductsData.products.length === 0 ? (
                    <div className="py-12 text-center">
                      <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="text-gray-400">베스트 상품 데이터가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {bestProductsData.products.slice(0, 12).map(renderBestProductCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 데이터가 없을 때 안내 */}
      {!trendData && !bestProductsData && !isLoading && (
        <Card className="border-gray-700 bg-gray-800">
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-white">트렌드 데이터 수집</h3>
            <p className="text-gray-400">카테고리를 선택하고 트렌드 데이터를 수집해보세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
