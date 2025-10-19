'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Download,
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
} from 'lucide-react'
import { checkTrendDataExists, collectTrendData, getTrendData } from '@/serverActions/analyze/trend-data.actions'
import CategorySelector from '../(_components)/CategorySelector'

// BigInt 직렬화를 위한 헬퍼 함수
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (Array.isArray(obj)) return obj.map(serializeBigInt)
  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value)
    }
    return serialized
  }
  return obj
}

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

export default function TrendAnalysisPage() {
  // 상태 관리
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('전체')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('daily')
  const [isLoading, setIsLoading] = useState(false)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [dataExists, setDataExists] = useState<{ exists: boolean; lastUpdated?: Date }>({
    exists: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    htmlContent?: string
    parsedData?: any
    rawData?: any
  } | null>(null)

  // 카테고리 선택 핸들러
  const handleCategoryChange = useCallback((categoryId: string | null, categoryName: string) => {
    // categoryId가 null이거나 'all'인 경우 "전체"로 처리
    const finalCategoryName = categoryId === null || categoryId === 'all' ? '전체' : categoryName
    setSelectedCategoryName(finalCategoryName)
    setTrendData(null) // 카테고리 변경 시 기존 데이터 초기화
    setDataExists({ exists: false })
  }, [])

  // 트렌드 데이터 확인 및 수집
  const handleFetchTrendData = async () => {
    if (!selectedCategoryName) return

    setIsLoading(true)
    setError(null)

    try {
      // 1. 기존 데이터 확인
      const checkResult = await checkTrendDataExists(selectedCategoryName)

      if (checkResult.exists) {
        // 기존 데이터가 있으면 조회
        console.log('📊 기존 트렌드 데이터 사용')
        const dataResult = await getTrendData(selectedCategoryName)

        if (dataResult.success && dataResult.data) {
          const transformedData: TrendData = {
            category: dataResult.data.categoryName,
            period: selectedPeriod === 'daily' ? '일간' : '주간',
            keywords: dataResult.data.keywords,
            totalCount: dataResult.data.totalKeywords,
            lastUpdated: dataResult.data.collectedAt || new Date().toISOString(),
          }
          setTrendData(transformedData)
          setDataExists({ exists: true, lastUpdated: checkResult.lastUpdated })
        }
      } else {
        // 기존 데이터가 없으면 새로 수집
        console.log('🔄 새로운 트렌드 데이터 수집')
        const collectResult = await collectTrendData(selectedCategoryName)

        if (collectResult.success && collectResult.data) {
          // 디버깅 정보 저장
          setDebugInfo({
            htmlContent: collectResult.data.htmlContent,
            parsedData: collectResult.data.parsedData,
            rawData: collectResult.data,
          })

          console.log('🔍 디버깅 정보:', {
            hasKeywords: !!collectResult.data.keywords,
            keywordsLength: collectResult.data.keywords?.length,
            firstKeyword: collectResult.data.keywords?.[0],
            rawData: collectResult.data,
          })

          const transformedData: TrendData = {
            category: collectResult.data.categoryName,
            period: selectedPeriod === 'daily' ? '일간' : '주간',
            keywords: collectResult.data.keywords || [],
            totalCount: collectResult.data.totalKeywords || 0,
            lastUpdated: new Date().toISOString(),
          }
          setTrendData(transformedData)
          setDataExists({ exists: true, lastUpdated: new Date() })
        } else {
          setError(collectResult.error || '데이터 수집에 실패했습니다.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 트렌드 아이콘 렌더링
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'new':
        return <Star className="h-4 w-4 text-blue-600" />
      case 'jump':
        return <Zap className="h-4 w-4 text-purple-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
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
      <Badge variant={getVariant(trend)} className="flex items-center gap-1">
        {renderTrendIcon(trend)}
        {trendText}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">키워드 트렌드 분석</h1>
            <p className="text-gray-400">카테고리별 일간/주간 키워드 트렌드 분석</p>
          </div>
        </div>

        {/* 카테고리 선택 */}
        <Card className="mb-6 border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5" />
              카테고리 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <CategorySelector onCategoryChange={handleCategoryChange} maxLevel={4} showAllOption={true} />

              {/* 기간 선택 */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-200">기간:</span>
                <Tabs value={selectedPeriod} onValueChange={value => setSelectedPeriod(value as 'daily' | 'weekly')}>
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
                      <BarChart3 className="h-4 w-4" />
                      {selectedCategoryName} 트렌드 분석
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

        {/* 트렌드 데이터 표시 */}
        {trendData && (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {trendData.category} 트렌드 ({trendData.period})
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />총 {trendData.totalCount}개 키워드
                  <span className="text-gray-500">•</span>
                  <Clock className="h-4 w-4" />
                  {new Date(trendData.lastUpdated).toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trendData.keywords.length === 0 ? (
                <div className="py-12 text-center">
                  <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-400">트렌드 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trendData.keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-700/50 p-4 transition-colors hover:bg-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {keyword.rank}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{keyword.keyword}</h3>
                          <p className="text-sm text-gray-400">{keyword.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderTrendBadge(keyword.trend, keyword.trendText)}
                        {keyword.searchVolume && (
                          <span className="text-sm text-gray-400">검색량: {keyword.searchVolume.toLocaleString()}</span>
                        )}
                        {keyword.competitionScore && (
                          <span className="text-sm text-gray-400">경쟁도: {keyword.competitionScore.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 디버깅 정보 */}
        {debugInfo && (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="text-white">🔍 디버깅 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* HTML 내용 */}
              {debugInfo.htmlContent && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-200">HTML 내용 (처음 1000자)</h4>
                  <div className="max-h-40 overflow-y-auto rounded bg-gray-900 p-3 text-xs text-gray-300">
                    <pre>{debugInfo.htmlContent.substring(0, 1000)}...</pre>
                  </div>
                </div>
              )}

              {/* 파싱된 데이터 */}
              {debugInfo.parsedData && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-200">파싱된 데이터</h4>
                  <div className="max-h-40 overflow-y-auto rounded bg-gray-900 p-3 text-xs text-gray-300">
                    <pre>{JSON.stringify(serializeBigInt(debugInfo.parsedData), null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* 원본 데이터 */}
              {debugInfo.rawData && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-200">원본 데이터</h4>
                  <div className="max-h-40 overflow-y-auto rounded bg-gray-900 p-3 text-xs text-gray-300">
                    <pre>{JSON.stringify(serializeBigInt(debugInfo.rawData), null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 데이터가 없을 때 안내 */}
        {!trendData && !isLoading && (
          <Card className="border-gray-700 bg-gray-800">
            <CardContent className="py-12 text-center">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-white">트렌드 데이터 수집</h3>
              <p className="text-gray-400">카테고리를 선택하고 트렌드 데이터를 수집해보세요.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
