'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getKeywordList } from './keywordServerAction'
import { useMe } from '@/hooks/useMe'
import { useSession } from 'next-auth/react'
import { pushToExtension, openOffscreenWindowExt } from '@/lib/utils/extension'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { RefreshCw, Search, AlertCircle, BarChart3, Package, Link, Settings } from 'lucide-react'

// 컴포넌트 import
import Overview from './components/Overview'
import ProductList from './components/ProductList'
import KeywordAnalysis from './components/KeywordAnalysis'
import RelatedKeywords from './components/RelatedKeywords'

const isDev = process.env.NODE_ENV === 'development'

function getSearchUrl(keyword: string) {
  const baseUrl = `https://search.shopping.naver.com/search/all`
  const params = new URLSearchParams()
  params.set('query', keyword)
  params.set('isToken', '1234')
  params.set('pagingIndex', '1')
  params.set('pagingSize', '80')
  params.set('sort', 'rel')
  params.set('timestamp', '')
  params.set('viewType', 'list')

  if (isDev) {
    params.set('isClose', (!isDev).toString())
    params.set('isDev', 'true')
  }
  return `${baseUrl}?${params.toString()}`
}

export default function KeywordAnalysisResultView({ keyword, extensionId }: { keyword: string; extensionId: string }) {
  const { status } = useSession()
  const { me } = useMe()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const { data, isFetching, fetchStatus, refetch, failureCount, failureReason, isLoading } = useQuery({
    queryKey: ['keyword_analysis', keyword, me?.id?.toString()],
    queryFn: async () => {
      if (!me?.id) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }
      const data = await getKeywordList(keyword, me.id.toString())
      console.log('🔍 getKeywordList 결과:', data)
      if (data.status === 'success') {
        return data.result
      } else {
        throw new Error(data.status)
      }
    },
    retry: 3,
    retryDelay: 5 * 1000,
    enabled: keyword.length > 0 && isEnabled && !!me?.id,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const handleSearch = useCallback(() => {
    console.log('🔍 handleSearch 시작')
    setIsEnabled(false)
    setIsSearching(true)

    const canMessageExt =
      typeof window !== 'undefined' && window.chrome?.runtime && typeof window.chrome.runtime.sendMessage === 'function'

    if (!canMessageExt) {
      console.error('❌ 확장 프로그램이 설치되지 않았거나 활성화되지 않았습니다.')
      alert('확장 프로그램이 설치되지 않았거나 활성화되지 않았습니다. 먼저 확장 프로그램을 설치하고 다시 시도해주세요.')
      setIsSearching(false)
      return
    }

    try {
      openOffscreenWindowExt({
        extensionId,
        targetUrl: getSearchUrl(keyword),
      }).then(res => {
        if (res.status === 'success') {
          console.log('✅ 확장 프로그램이 성공적으로 실행되었습니다.')
          // 확장 프로그램이 자동으로 데이터를 처리하므로 상태만 업데이트
          setIsEnabled(true)
          setIsSearching(false)
        } else {
          console.error('❌ 확장 프로그램 실행 실패')
          alert('확장 프로그램이 설치되지 않았거나 활성화되지 않았습니다.')
          setIsSearching(false)
        }
      })
    } catch (err) {
      console.error(err)
      alert('Extension is not installed. Please install the extension first.')
      setIsSearching(false)
    }
  }, [keyword, extensionId, refetch])

  useEffect(() => {
    if (status !== 'authenticated' || !keyword || keyword.length === 0 || hasInitialized) return

    setHasInitialized(true)
    // 실제 확장 프로그램 데이터 사용
    handleSearch()
  }, [keyword, status, handleSearch, hasInitialized])

  const loading = isLoading || isFetching || isSearching || !hasInitialized
  const displayData = data

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-white">
              {!hasInitialized
                ? '키워드 분석을 시작합니다...'
                : isSearching
                  ? '확장 프로그램에서 데이터를 수집 중...'
                  : '키워드 분석 중...'}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {!hasInitialized
                ? '잠시만 기다려주세요.'
                : isSearching
                  ? '잠시만 기다려주세요. 데이터 수집이 완료되면 자동으로 표시됩니다.'
                  : '데이터를 불러오는 중입니다.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!displayData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md border-gray-700 bg-gray-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
            <h3 className="mb-2 font-medium text-white">데이터를 불러올 수 없습니다</h3>
            <p className="mb-4 text-sm text-gray-400">
              확장프로그램이 설치되지 않았거나 데이터 수집에 실패했습니다.
              <br />
              먼저 확장프로그램을 설치하고 다시 시도해주세요.
            </p>
            <div className="space-y-2">
              <Button onClick={() => handleSearch()} className="bg-blue-600 hover:bg-blue-700" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    수집 중...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    키워드 분석 시작
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isDataValid = displayData

  if (!isDataValid) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md border-gray-700 bg-gray-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 font-medium text-white">데이터 형식이 올바르지 않습니다</h3>
            <p className="mb-4 text-sm text-gray-400">
              확장프로그램에서 받은 데이터가 예상 형식과 다릅니다.
              <br />
              상품 정보가 없거나 데이터가 불완전합니다.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => handleSearch()}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 데이터 변환 함수들
  const transformToBasicStats = (data: any) => {
    const misc = data.misc as any
    const adMisc = data.adMisc as any

    // 실제 데이터 사용
    const productCount = misc.total || 0
    const monthlySearchCount = misc.monthlySearchCount || 0
    const competitionScore = productCount && monthlySearchCount ? productCount / monthlySearchCount : 0

    let competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM'
    if (competitionScore < 0.5) competitionLevel = 'LOW'
    else if (competitionScore < 1.0) competitionLevel = 'MEDIUM'
    else if (competitionScore < 2.0) competitionLevel = 'HIGH'
    else competitionLevel = 'VERY_HIGH'

    return {
      productCount: productCount,
      averagePrice: data.top40AveragePrice || 0,
      competitionLevel,
      competitionScore: Number(competitionScore),
      searchVolume: monthlySearchCount,
      brandProtection: adMisc?.queryValidate?.isAdultQuery || false,
      trendDirection: 'stable' as const,
      trendPercentage: 0,
    }
  }

  const transformToTrendData = (data: any) => [
    // 실제로는 시계열 데이터가 필요하지만, 샘플 데이터로 대체
    { date: '2024-01', sales: 0, searchVolume: 0 },
    { date: '2024-02', sales: 0, searchVolume: 0 },
    { date: '2024-03', sales: 0, searchVolume: 0 },
  ]

  const transformToAnalysisData = (data: any) => ({
    searchVolume: {
      monthly: data.monthlySearchCount || 0,
      weekly: Math.floor((data.monthlySearchCount || 0) / 4),
      daily: Math.floor((data.monthlySearchCount || 0) / 30),
      trend: 'stable' as const,
      trendPercentage: 0,
    },
    competition: {
      level: 'MEDIUM' as const,
      score: 0,
      adCompetition: 0,
      organicCompetition: 0,
    },
    pricing: {
      averagePrice: data.top40AveragePrice || 0,
      minPrice: (data.top40AveragePrice || 0) * 0.5,
      maxPrice: (data.top40AveragePrice || 0) * 2,
      priceDistribution: [
        { range: '0-10만원', count: 0 },
        { range: '10-30만원', count: 0 },
        { range: '30-50만원', count: 0 },
        { range: '50만원+', count: 0 },
      ],
    },
    traffic: {
      totalVisits: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      conversionRate: 0,
    },
    seasonality: [
      { month: '1월', searchVolume: 0, sales: 0 },
      { month: '2월', searchVolume: 0, sales: 0 },
      { month: '3월', searchVolume: 0, sales: 0 },
    ],
  })

  const transformToRelatedQueries = (data: any) => {
    // console.log('🔍 transformToRelatedQueries 입력 데이터:', {
    //   relatedQueries: data.relatedQueries,
    //   relatedQueriesBottom: data.relatedQueriesBottom,
    // })

    // relatedQueries와 relatedQueriesBottom을 모두 합쳐서 사용
    const relatedQueries = data.relatedQueries || []
    const relatedQueriesBottom = data.relatedQueriesBottom || []
    const allRelatedQueries = [...relatedQueries, ...relatedQueriesBottom]

    const result = Array.isArray(allRelatedQueries)
      ? allRelatedQueries.map((item: any) => ({
          query: item.query || '',
          imageUrl: item.imageUrl || '',
          searchVolume: Math.floor(Math.random() * 10000),
          competitionLevel: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'][Math.floor(Math.random() * 4)] as any,
          productCount: Math.floor(Math.random() * 1000),
          averagePrice: Math.floor(Math.random() * 100000),
        }))
      : []

    // console.log('🔍 transformToRelatedQueries 최종 결과:', result)
    return result
  }

  const transformToSalesInfoData = (data: any) => {
    // console.log('🔍 transformToSalesInfoData 입력 데이터:', {
    //   product10Prices: data.product10Prices,
    //   product40Prices: data.product40Prices,
    //   average10Price: data.average10Price,
    //   average40Price: data.average40Price,
    // })

    const result = {
      top10Sales: data.product10Prices?.price || 0,
      top10Quantity: data.product10Prices?.purchaseCount || 0,
      top10AvgPrice: data.average10Price || 0,
      top40Sales: data.product40Prices?.price || 0,
      top40Quantity: data.product40Prices?.purchaseCount || 0,
      top40AvgPrice: data.average40Price || 0,
    }

    return result
  }

  const transformToRecommendTrend = (data: any) => {
    const misc = data.misc as any
    return {
      gdid: misc?.recommendTrend?.gdid || '',
      tags: (misc?.recommendTrend?.tags || []).map((tag: any) => ({
        ...tag,
        searchVolume: Math.floor(Math.random() * 5000),
        trendScore: Math.floor(Math.random() * 100),
      })),
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">"{keyword}" 키워드 분석</h1>
          <div className="mt-2 flex items-center gap-4">
            <Badge variant="outline" className="border-blue-500 text-blue-400">
              키워드 분석
            </Badge>
            <span className="text-sm text-gray-400">총 {displayData.productCount?.toLocaleString() || 0}개 상품</span>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="mr-2 h-4 w-4" />
            개요
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-gray-700">
            <Package className="mr-2 h-4 w-4" />
            상품 목록
          </TabsTrigger>
          <TabsTrigger value="keywords" className="data-[state=active]:bg-gray-700">
            <Link className="mr-2 h-4 w-4" />
            연관 키워드
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-gray-700">
            <Settings className="mr-2 h-4 w-4" />
            검색최적화
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <Overview
            keyword={keyword}
            basicStats={transformToBasicStats(displayData)}
            trendData={transformToTrendData(displayData)}
            relatedKeywords={transformToRelatedQueries(displayData)}
            salesInfoData={transformToSalesInfoData(displayData)}
            brandInfo={{
              isProtected: false,
              brandName: undefined,
              protectionLevel: undefined,
            }}
            onViewAllKeywords={() => {
              // 연관 키워드 탭으로 이동
              setActiveTab('keywords')
            }}
          />
        </TabsContent>

        {/* 상품 목록 탭 */}
        <TabsContent value="products" className="space-y-6">
          <ProductList
            products={(displayData.productInfos as any[]) || []}
            total={displayData.productCount || 0}
            keywordId={keyword}
          />
        </TabsContent>

        {/* 연관 키워드 탭 */}
        <TabsContent value="keywords" className="space-y-6">
          {((displayData.relatedKeywords as string[])?.length > 0 || (displayData.misc as any)?.recommendTrend) && (
            <RelatedKeywords
              keywordId={keyword}
              platformSource="naver"
              relatedQueries={transformToRelatedQueries(displayData)}
              recommendTrend={transformToRecommendTrend(displayData)}
              onExport={() => {
                console.log('연관 키워드 엑셀 다운로드')
              }}
            />
          )}
        </TabsContent>

        {/* 검색최적화 탭 */}
        <TabsContent value="seo" className="space-y-6">
          <KeywordAnalysis
            keywordId={keyword}
            analysisData={transformToAnalysisData(displayData)}
            onDownloadExcel={() => {
              console.log('엑셀 다운로드')
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
