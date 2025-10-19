'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { useState, useCallback, useEffect } from 'react'
import {
  collectBestProducts,
  getBestProducts,
  checkBestProductsExists,
  type BestProduct,
} from '@/serverActions/analyze/best-products.actions'
import CategoryTabs from '../(_components)/CategoryTabs'
import { getMainCategories } from '@/serverActions/analyze/category.actions'
import { collectTrendData } from '@/serverActions/analyze/trend-data.actions'
import { RefreshCw, Package, Star, Truck, ExternalLink, BarChart3 } from 'lucide-react'

interface BestProductsData {
  categoryName: string
  products: BestProduct[]
  totalProducts: number
  collectedAt: string
}

export default function BestProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('daily')
  const [bestProductsData, setBestProductsData] = useState<BestProductsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBatchLoading, setIsBatchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; category: string } | null>(null)

  // 베스트 상품 데이터 수집
  const handleCollectData = useCallback(async () => {
    if (!selectedCategory) return

    setIsLoading(true)
    setError(null)

    try {
      const periodType = selectedPeriod === 'weekly' ? 'WEEKLY' : 'DAILY'
      const result = await collectBestProducts(selectedCategory, periodType)

      if (result.success && result.data) {
        setBestProductsData(result.data)
      } else {
        setError(result.error || '데이터 수집에 실패했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, selectedPeriod])

  // 키워드 분석 데이터 수집
  const handleCollectTrendData = useCallback(async () => {
    if (!selectedCategory) return

    setIsLoading(true)
    setError(null)

    try {
      const periodType = selectedPeriod === 'weekly' ? 'WEEKLY' : 'DAILY'
      const result = await collectTrendData(selectedCategory, periodType)

      if (result.success) {
        setError(null)
        alert('키워드 분석 데이터 수집이 완료되었습니다.')
      } else {
        setError(result.error || '키워드 분석 데이터 수집에 실패했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, selectedPeriod])

  // 베스트 상품 데이터 조회
  const handleLoadData = useCallback(async () => {
    if (!selectedCategory) return

    setIsLoading(true)
    setError(null)

    try {
      const periodType = selectedPeriod === 'weekly' ? 'WEEKLY' : 'DAILY'
      const result = await getBestProducts(selectedCategory, periodType)

      if (result.success && result.data) {
        setBestProductsData(result.data)
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, selectedPeriod])

  // 카테고리 변경 핸들러
  const handleCategoryChange = (categoryId: string | null, categoryName: string) => {
    setSelectedCategory(categoryName)
    setBestProductsData(null)
    setError(null)
  }

  // 기간 변경 핸들러
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as 'daily' | 'weekly')
    setBestProductsData(null)
    setError(null)
  }

  // 일괄 수집 핸들러
  const handleBatchCollect = useCallback(async () => {
    setIsBatchLoading(true)
    setError(null)
    setBatchProgress(null)

    try {
      // 1차 카테고리 목록 가져오기
      const mainCategories = await getMainCategories()
      const disabledCategories = ['도서', '여가/생활편의']

      // 1차 카테고리만 필터링 (비활성화된 카테고리만 제외)
      const activeCategories = mainCategories.filter(cat => !disabledCategories.includes(cat.name)).map(cat => cat.name)

      const periodTypes: ('DAILY' | 'WEEKLY')[] = ['DAILY', 'WEEKLY']
      const dataTypes = ['키워드 분석', '베스트 상품']
      const totalTasks = activeCategories.length * periodTypes.length * dataTypes.length
      let currentTask = 0

      for (const category of activeCategories) {
        for (const periodType of periodTypes) {
          for (const dataType of dataTypes) {
            currentTask++
            setBatchProgress({
              current: currentTask,
              total: totalTasks,
              category: `${category} (${periodType === 'DAILY' ? '일간' : '주간'}) - ${dataType}`,
            })

            try {
              if (dataType === '키워드 분석') {
                await collectTrendData(category, periodType)
              } else {
                await collectBestProducts(category, periodType)
              }
              console.log(`✅ ${category} ${periodType} ${dataType} 데이터 수집 완료`)
            } catch (error) {
              console.error(`❌ ${category} ${periodType} ${dataType} 데이터 수집 실패:`, error)
            }

            // API 호출 간격 조절 (1초 대기)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      setBatchProgress(null)
      alert(`일괄 수집 완료! 총 ${totalTasks}개 작업이 완료되었습니다.`)
    } catch (error) {
      setError(error instanceof Error ? error.message : '일괄 수집 중 오류가 발생했습니다.')
    } finally {
      setIsBatchLoading(false)
    }
  }, [])

  // 상품 카드 렌더링
  const renderProductCard = (product: BestProduct) => (
    <Card key={product.rank} className="transition-shadow hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 순위 */}
          <div className="flex-shrink-0">
            <Badge variant="secondary" className="min-w-[3rem] text-center text-lg font-bold">
              {product.rank}위
            </Badge>
          </div>

          {/* 상품 정보 */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{product.title}</h3>
              {product.productUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => window.open(product.productUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1">
              {/* 브랜드 */}
              {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}

              {/* 가격 정보 */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{product.price.toLocaleString()}원</span>
                {product.originalPrice && product.discountRate && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      {product.originalPrice.toLocaleString()}원
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {product.discountRate}% 할인
                    </Badge>
                  </>
                )}
              </div>

              {/* 배송 정보 */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {product.isFreeShipping ? (
                  <span className="font-medium text-green-600">무료배송</span>
                ) : (
                  <span>배송비 {product.shippingFee?.toLocaleString()}원</span>
                )}
                {product.isNaverDelivery && (
                  <Badge variant="outline" className="text-xs">
                    N배송
                  </Badge>
                )}
              </div>

              {/* 평점 및 리뷰 */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating}</span>
                </div>
                <span>리뷰 {product.reviewCount.toLocaleString()}개</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-6 flex items-center gap-2">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-bold">데이터 관리</h1>
      </div>

      {/* 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>데이터 수집 설정</CardTitle>
          <CardDescription>키워드 분석 및 베스트 상품 데이터를 수집하고 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리</label>
            <CategoryTabs onCategoryChange={handleCategoryChange} selectedCategoryName={selectedCategory} />
          </div>

          {/* 기간 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">기간</label>
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

          {/* 액션 버튼 */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleLoadData} disabled={isLoading || isBatchLoading} variant="outline">
                기존 데이터 조회
              </Button>
              <Button
                onClick={handleCollectTrendData}
                disabled={isLoading || isBatchLoading}
                className="bg-green-600 hover:bg-green-700">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    수집 중...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    키워드 분석 수집
                  </>
                )}
              </Button>
              <Button
                onClick={handleCollectData}
                disabled={isLoading || isBatchLoading}
                className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    수집 중...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    베스트 상품 수집
                  </>
                )}
              </Button>
            </div>

            {/* 일괄 수집 버튼 */}
            <div className="border-t pt-4">
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-300">일괄 데이터 수집</h4>
                <p className="text-xs text-gray-500">
                  모든 활성화된 카테고리의 키워드 분석 및 베스트 상품 데이터를 일괄 수집합니다.
                </p>
              </div>
              <Button
                onClick={handleBatchCollect}
                disabled={isLoading || isBatchLoading}
                className="w-full bg-green-600 hover:bg-green-700">
                {isBatchLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    일괄 수집 중...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    전체 데이터 일괄 수집
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="p-4">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 일괄 수집 진행률 */}
      {batchProgress && (
        <Card className="border-blue-500">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">일괄 수집 진행 중...</span>
                <span className="text-gray-400">
                  {batchProgress.current} / {batchProgress.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">현재: {batchProgress.category}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 베스트 상품 목록 */}
      {bestProductsData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {bestProductsData.categoryName} 베스트 상품 ({bestProductsData.totalProducts}개)
            </CardTitle>
            <CardDescription>수집일: {new Date(bestProductsData.collectedAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">{bestProductsData.products.map(renderProductCard)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
