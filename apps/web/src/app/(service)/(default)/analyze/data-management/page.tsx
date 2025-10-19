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
import CategorySelector from '../(_components)/CategorySelector'
import { getMainCategories } from '@/serverActions/analyze/category.actions'
import { collectTrendData } from '@/serverActions/analyze/trend-data.actions'
import {
  fetchDataLabKeywordsParallel,
  type DataLabParallelRequest,
} from '@/serverActions/analyze/datalab-parallel.actions'
import {
  fetchDataLabKeywordsDirect,
  getDataLabKeywords,
  type DataLabDirectRequest,
} from '@/serverActions/analyze/datalab-direct.actions'
import { RefreshCw, Package, Star, Truck, ExternalLink, BarChart3, Database, Globe } from 'lucide-react'

interface BestProductsData {
  categoryName: string
  products: BestProduct[]
  totalProducts: number
  collectedAt: string
}

export default function DataManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('daily')
  const [bestProductsData, setBestProductsData] = useState<BestProductsData | null>(null)
  const [trendData, setTrendData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBatchLoading, setIsBatchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; category: string } | null>(null)

  // 데이터랩 페칭 관련 상태
  const [activeTab, setActiveTab] = useState<'trend' | 'products' | 'datalab'>('trend')
  const [isDataLabLoading, setIsDataLabLoading] = useState(false)
  const [dataLabProgress, setDataLabProgress] = useState<{ current: number; total: number; category: string } | null>(
    null,
  )
  const [dataLabResult, setDataLabResult] = useState<{
    success: boolean
    totalKeywords: number
    categories: string[]
  } | null>(null)

  // 데이터랩 카테고리 선택 상태
  const [selectedDataLabCategory, setSelectedDataLabCategory] = useState<{ id: string; name: string } | null>(null)

  // 데이터랩 카테고리 변경 핸들러
  const handleDataLabCategoryChange = useCallback((categoryId: string | null, categoryName: string) => {
    if (categoryId && categoryName) {
      setSelectedDataLabCategory({ id: categoryId, name: categoryName })
    } else {
      setSelectedDataLabCategory(null)
    }
  }, [])

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

      if (result.success && result.data) {
        setTrendData(result.data)
        setError(null)
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

  // 데이터랩 카테고리별 페칭 (직접 페칭 + DB 저장)
  const handleDataLabCategoryFetch = useCallback(async () => {
    if (!selectedDataLabCategory) {
      setError('카테고리 선택')
      return
    }

    setIsDataLabLoading(true)
    setError(null)
    setDataLabResult(null)

    try {
      const periodType = selectedPeriod === 'weekly' ? 'week' : 'date'
      const request: DataLabDirectRequest = {
        categoryId: selectedDataLabCategory.id,
        categoryName: selectedDataLabCategory.name,
        timeUnit: periodType,
        maxPages: 25,
        device: 'all',
        gender: 'all',
        ageGroup: '',
      }

      setDataLabProgress({ current: 1, total: 1, category: selectedDataLabCategory.name })

      const result = await fetchDataLabKeywordsDirect(request)

      if (result && result.success) {
        setDataLabResult({
          success: true,
          totalKeywords: result.totalKeywords,
          categories: [selectedDataLabCategory.name],
        })

        // DB에서 최신 데이터 조회해서 표시
        const dbResult = await getDataLabKeywords(
          selectedDataLabCategory.name,
          selectedPeriod === 'weekly' ? 'WEEKLY' : 'DAILY',
        )
        if (dbResult.success && dbResult.data) {
          setTrendData(dbResult.data)
        }
      } else {
        setError(result?.errors?.[0] || '데이터랩 페칭에 실패했습니다.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '데이터랩 페칭 중 오류가 발생했습니다.')
    } finally {
      setIsDataLabLoading(false)
      setDataLabProgress(null)
    }
  }, [selectedDataLabCategory, selectedPeriod])

  // 데이터랩 전체 카테고리 페칭
  const handleDataLabAllFetch = useCallback(async () => {
    setIsDataLabLoading(true)
    setError(null)
    setDataLabResult(null)

    try {
      const mainCategories = await getMainCategories()
      const disabledCategories = ['도서', '여가/생활편의']
      const activeCategories = mainCategories.filter(cat => !disabledCategories.includes(cat.name))

      const periodType = selectedPeriod === 'weekly' ? 'week' : 'date'
      const totalTasks = activeCategories.length
      let currentTask = 0
      let totalKeywords = 0
      const processedCategories: string[] = []

      for (const category of activeCategories) {
        currentTask++
        setDataLabProgress({
          current: currentTask,
          total: totalTasks,
          category: `${category.name} (${selectedPeriod === 'weekly' ? '주간' : '일간'})`,
        })

        try {
          const request: DataLabDirectRequest = {
            categoryId: category.id.toString(),
            categoryName: category.name,
            timeUnit: periodType,
            maxPages: 25,
            device: 'all',
            gender: 'all',
            ageGroup: '',
          }

          const result = await fetchDataLabKeywordsDirect(request)

          if (result && result.success) {
            totalKeywords += result.totalKeywords
            processedCategories.push(category.name)
          }

          // 각 카테고리 간 2초 대기 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          console.error(`❌ ${category.name} 데이터랩 페칭 실패:`, error)
        }
      }

      setDataLabResult({
        success: true,
        totalKeywords,
        categories: processedCategories,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : '전체 데이터랩 페칭 중 오류가 발생했습니다.')
    } finally {
      setIsDataLabLoading(false)
      setDataLabProgress(null)
    }
  }, [selectedPeriod])

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
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">데이터 관리</h1>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'trend' | 'products' | 'datalab')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            키워드 분석
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            베스트 상품
          </TabsTrigger>
          <TabsTrigger value="datalab" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            네이버 데이터랩
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 키워드 분석 탭 */}
      {activeTab === 'trend' && (
        <div className="space-y-6">
          {/* 수집 설정 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>키워드 분석 데이터 수집</CardTitle>
              <CardDescription>네이버 쇼핑 키워드 트렌드 데이터를 수집합니다.</CardDescription>
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
              </div>
            </CardContent>
          </Card>

          {/* 키워드 분석 결과 */}
          {trendData && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  키워드 분석 결과
                </CardTitle>
                <CardDescription>
                  {selectedCategory} - {selectedPeriod === 'weekly' ? '주간' : '일간'} 데이터
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 요약 정보 */}
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-gray-700/50 p-3">
                      <div className="text-gray-400">총 키워드 수</div>
                      <div className="text-lg font-bold text-white">{trendData.keywords?.length || 0}개</div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-3">
                      <div className="text-gray-400">수집일</div>
                      <div className="text-sm text-white">
                        {trendData.collectedAt ? new Date(trendData.collectedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-3">
                      <div className="text-gray-400">카테고리</div>
                      <div className="text-sm text-white">{trendData.categoryName || selectedCategory}</div>
                    </div>
                  </div>

                  {/* 키워드 목록 */}
                  {trendData.keywords && trendData.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-200">키워드 목록 (상위 20개)</h4>
                      <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-600">
                        <div className="space-y-1 p-2">
                          {trendData.keywords.slice(0, 20).map((keyword: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg bg-gray-700/30 p-3 hover:bg-gray-700/50">
                              <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                  {keyword.rank || index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{keyword.keyword}</div>
                                  {keyword.trend && (
                                    <div className="text-xs text-gray-400">
                                      트렌드: {keyword.trendText || keyword.trend}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-400">
                                {keyword.monthlySearchCount && (
                                  <div>월 검색량: {keyword.monthlySearchCount.toLocaleString()}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 베스트 상품 탭 */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>베스트 상품 데이터 수집</CardTitle>
              <CardDescription>네이버 쇼핑 베스트 상품 데이터를 수집합니다.</CardDescription>
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
              <div className="flex gap-2">
                <Button onClick={handleLoadData} disabled={isLoading || isBatchLoading} variant="outline">
                  기존 데이터 조회
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
            </CardContent>
          </Card>

          {/* 베스트 상품 목록 */}
          {bestProductsData && (
            <Card className="border-blue-500">
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
      )}

      {/* 네이버 데이터랩 탭 */}
      {activeTab === 'datalab' && (
        <Card>
          <CardHeader>
            <CardTitle>네이버 데이터랩 페칭</CardTitle>
            <CardDescription>네이버 데이터랩에서 키워드 데이터를 대량으로 페칭합니다. (1-25페이지)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 카테고리 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리 선택</label>
              <CategorySelector
                onCategoryChange={handleDataLabCategoryChange}
                maxLevel={4}
                showAllOption={false}
                placeholder="카테고리 선택"
              />
              {selectedDataLabCategory && (
                <div className="rounded-lg border border-blue-500 bg-blue-900/20 p-3">
                  <p className="text-sm text-blue-200">
                    <span className="font-medium">선택된 카테고리:</span> {selectedDataLabCategory.name}
                  </p>
                </div>
              )}
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
                <Button
                  onClick={handleDataLabCategoryFetch}
                  disabled={isDataLabLoading || !selectedDataLabCategory}
                  className="bg-orange-600 hover:bg-orange-700">
                  {isDataLabLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      페칭 중...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      카테고리별 페칭 (1-25페이지)
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDataLabAllFetch}
                  disabled={isDataLabLoading}
                  className="bg-red-600 hover:bg-red-700">
                  {isDataLabLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      전체 페칭 중...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      전체 카테고리 페칭
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 일괄 수집 버튼 (모든 탭에서 공통) */}
      <Card>
        <CardHeader>
          <CardTitle>일괄 데이터 수집</CardTitle>
          <CardDescription>
            키워드 분석과 베스트 상품 데이터를 모든 활성 카테고리에 대해 일괄 수집합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleBatchCollect}
            disabled={isLoading || isBatchLoading}
            className="w-full bg-purple-600 hover:bg-purple-700">
            {isBatchLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                일괄 수집 중... ({batchProgress?.current || 0}/{batchProgress?.total || 0})
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                전체 데이터 일괄 수집 (키워드 분석 + 베스트 상품)
              </>
            )}
          </Button>
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

      {/* 데이터랩 페칭 진행률 */}
      {dataLabProgress && (
        <Card className="border-orange-500">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-orange-400">데이터랩 페칭 진행 중...</span>
                <span className="text-gray-400">
                  {dataLabProgress.current} / {dataLabProgress.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-orange-600 transition-all duration-300"
                  style={{ width: `${(dataLabProgress.current / dataLabProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">현재: {dataLabProgress.category}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 데이터랩 페칭 결과 */}
      {dataLabResult && (
        <Card className="border-green-500">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-green-400">데이터랩 페칭 완료</span>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-gray-400">총 키워드 수:</span>
                  <span className="ml-2 font-medium">{dataLabResult.totalKeywords.toLocaleString()}개</span>
                </div>
                <div>
                  <span className="text-gray-400">처리된 카테고리:</span>
                  <span className="ml-2 font-medium">{dataLabResult.categories.length}개</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">카테고리: {dataLabResult.categories.join(', ')}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
