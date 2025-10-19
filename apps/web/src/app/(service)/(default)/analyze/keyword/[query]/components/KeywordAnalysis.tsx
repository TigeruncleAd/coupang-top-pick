'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import {
  BarChart3,
  TrendingUp,
  Download,
  Target,
  Search,
  DollarSign,
  Users,
  Activity,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react'

interface AnalysisData {
  searchVolume: {
    monthly: number
    weekly: number
    daily: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  competition: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    score: number
    adCompetition: number
    organicCompetition: number
  }
  pricing: {
    averagePrice: number
    minPrice: number
    maxPrice: number
    priceDistribution: Array<{ range: string; count: number }>
  }
  traffic: {
    totalVisits: number
    bounceRate: number
    avgSessionDuration: number
    conversionRate: number
  }
  seasonality: Array<{ month: string; searchVolume: number; sales: number }>
}

interface KeywordAnalysisProps {
  keywordId: string
  analysisData: AnalysisData
  chartConfig?: {
    colors: string[]
    height: number
  }
  onDownloadExcel?: () => void
}

export default function KeywordAnalysis({
  keywordId,
  analysisData,
  chartConfig = { colors: ['#3b82f6', '#10b981', '#f59e0b'], height: 300 },
  onDownloadExcel,
}: KeywordAnalysisProps) {
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-400 bg-green-900/20'
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-900/20'
      case 'HIGH':
        return 'text-orange-400 bg-orange-900/20'
      case 'VERY_HIGH':
        return 'text-red-400 bg-red-900/20'
      default:
        return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'down':
        return <TrendingUp className="h-4 w-4 rotate-180 text-red-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">키워드 분석</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadExcel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            개요
          </TabsTrigger>
          <TabsTrigger value="competition" className="data-[state=active]:bg-gray-700">
            경쟁도
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-gray-700">
            가격 분석
          </TabsTrigger>
          <TabsTrigger value="traffic" className="data-[state=active]:bg-gray-700">
            트래픽
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 검색량 */}
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">월간 검색량</p>
                    <p className="text-2xl font-bold text-white">
                      {analysisData.searchVolume.monthly.toLocaleString()}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {getTrendIcon(analysisData.searchVolume.trend)}
                      <span
                        className={`text-sm ${
                          analysisData.searchVolume.trend === 'up'
                            ? 'text-green-400'
                            : analysisData.searchVolume.trend === 'down'
                              ? 'text-red-400'
                              : 'text-gray-400'
                        }`}>
                        {analysisData.searchVolume.trendPercentage > 0 ? '+' : ''}
                        {analysisData.searchVolume.trendPercentage}%
                      </span>
                    </div>
                  </div>
                  <Search className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            {/* 경쟁도 */}
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">경쟁 강도</p>
                    <p className="text-2xl font-bold text-white">{analysisData.competition.score}/100</p>
                    <Badge className={`mt-1 ${getCompetitionColor(analysisData.competition.level)}`}>
                      {analysisData.competition.level}
                    </Badge>
                  </div>
                  <Target className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            {/* 평균 가격 */}
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">평균 가격</p>
                    <p className="text-2xl font-bold text-white">
                      ₩{analysisData.pricing.averagePrice.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      ₩{analysisData.pricing.minPrice.toLocaleString()} - ₩
                      {analysisData.pricing.maxPrice.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            {/* 트래픽 */}
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">월간 방문자</p>
                    <p className="text-2xl font-bold text-white">{analysisData.traffic.totalVisits.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-gray-400">전환율 {analysisData.traffic.conversionRate}%</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 계절성 차트 */}
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                월별 검색량 및 매출 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.seasonality.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-700 py-2 last:border-b-0">
                    <span className="w-16 text-sm text-gray-300">{data.month}</span>
                    <div className="mx-4 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{
                              width: `${(data.searchVolume / Math.max(...analysisData.seasonality.map(d => d.searchVolume))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs text-gray-400">
                          {data.searchVolume.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">₩{data.sales.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">매출</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 경쟁도 탭 */}
        <TabsContent value="competition" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">광고 경쟁도</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">광고 클릭 경쟁도</span>
                    <span className="text-lg font-bold text-white">{analysisData.competition.adCompetition}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${analysisData.competition.adCompetition}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">자연 검색 경쟁도</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">자연 검색 경쟁도</span>
                    <span className="text-lg font-bold text-white">{analysisData.competition.organicCompetition}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${analysisData.competition.organicCompetition}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 가격 분석 탭 */}
        <TabsContent value="pricing" className="space-y-4">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="text-white">가격 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.pricing.priceDistribution.map((dist, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="w-24 text-sm text-gray-300">{dist.range}</span>
                    <div className="mx-4 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{
                              width: `${(dist.count / Math.max(...analysisData.pricing.priceDistribution.map(d => d.count))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-gray-400">{dist.count}개</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 트래픽 탭 */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">이탈률</p>
                    <p className="text-2xl font-bold text-white">{analysisData.traffic.bounceRate}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">평균 세션 시간</p>
                    <p className="text-2xl font-bold text-white">{analysisData.traffic.avgSessionDuration}분</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">전환율</p>
                    <p className="text-2xl font-bold text-white">{analysisData.traffic.conversionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
