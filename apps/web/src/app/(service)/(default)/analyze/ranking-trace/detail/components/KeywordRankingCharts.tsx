'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { BarChart3, TrendingUp, DollarSign, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// 예상 판매량 차트 (Mock 데이터)
function ExpectedSalesChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // Mock 데이터 생성
  const generateMockData = (period: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data = []
    const baseValue = 1000

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))

      // 랜덤한 변동 추가
      const variation = (Math.random() - 0.5) * 200
      const value = Math.max(0, baseValue + variation + i * 10) // 약간의 상승 트렌드

      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
      })
    }

    return data
  }

  const mockData = generateMockData(selectedPeriod)

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            예상 판매량
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-700 p-4">
              <p className="text-sm text-gray-300">예상 판매량</p>
              <p className="text-2xl font-bold text-white">
                {mockData[mockData.length - 1]?.value?.toLocaleString() || 0}개
              </p>
            </div>

            {/* 예상 판매량 그래프 */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={value =>
                      new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={value => value.toLocaleString()} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                    labelFormatter={value => new Date(value).toLocaleDateString('ko-KR')}
                    formatter={(value: any) => [`${value.toLocaleString()}개`, '예상 판매량']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center text-gray-400">
              <p className="text-sm">기간: {selectedPeriod}</p>
              <p className="text-xs">데이터 포인트: {mockData.length}개</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 리뷰 수 차트 (실제 데이터 기반)
interface ReviewChartProps {
  reviewData: Array<{
    date: string
    reviewCount: number
    addedReviews: number
  }>
}

function ReviewChart({ reviewData }: ReviewChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // 데이터 필터링
  const filteredData = reviewData.filter((item, index) => {
    if (selectedPeriod === '7d') return index >= reviewData.length - 7
    if (selectedPeriod === '30d') return index >= reviewData.length - 30
    return true
  })

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5" />
            리뷰 수 변화
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {filteredData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-300">총 리뷰 수</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredData[filteredData.length - 1]?.reviewCount?.toLocaleString() || 0}개
                  </p>
                </div>
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-300">최근 추가</p>
                  <p className="text-2xl font-bold text-green-400">
                    +{filteredData[filteredData.length - 1]?.addedReviews || 0}개
                  </p>
                </div>
              </div>

              {/* 추가된 리뷰 수 그래프 */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={value =>
                        new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                      }
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={value => `+${value}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                      labelFormatter={value => new Date(value).toLocaleDateString('ko-KR')}
                      formatter={(value: any) => [`+${value}개`, '추가된 리뷰']}
                    />
                    <Line
                      type="monotone"
                      dataKey="addedReviews"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center text-gray-400">
                <p className="text-sm">기간: {selectedPeriod}</p>
                <p className="text-xs">데이터 포인트: {filteredData.length}개</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <Users className="mx-auto mb-2 h-12 w-12" />
                <p>리뷰 수 변화 차트</p>
                <p className="text-sm">데이터가 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 가격 차트 (실제 데이터 기반)
interface PriceChartProps {
  priceData: Array<{
    date: string
    price: number
    originalPrice: number
    discountRate: number
  }>
}

function PriceChart({ priceData }: PriceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // 데이터 필터링
  const filteredData = priceData.filter((item, index) => {
    if (selectedPeriod === '7d') return index >= priceData.length - 7
    if (selectedPeriod === '30d') return index >= priceData.length - 30
    return true
  })

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5" />
            가격 변화
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {filteredData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-300">현재 가격</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredData[filteredData.length - 1]?.price?.toLocaleString() || 0}원
                  </p>
                </div>
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-300">할인율</p>
                  <p className="text-2xl font-bold text-red-400">
                    {filteredData[filteredData.length - 1]?.discountRate || 0}%
                  </p>
                </div>
              </div>

              {/* 가격 변화 그래프 */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={value =>
                        new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                      }
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={value => `${value.toLocaleString()}원`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                      labelFormatter={value => new Date(value).toLocaleDateString('ko-KR')}
                      formatter={(value: any) => [`${value.toLocaleString()}원`, '현재 가격']}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center text-gray-400">
                <p className="text-sm">기간: {selectedPeriod}</p>
                <p className="text-xs">데이터 포인트: {filteredData.length}개</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <DollarSign className="mx-auto mb-2 h-12 w-12" />
                <p>가격 변화 차트</p>
                <p className="text-sm">데이터가 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 평점 차트 (실제 데이터 기반)
interface RatingChartProps {
  ratingData: Array<{
    date: string
    rating: number
    reviewCount: number
  }>
}

function RatingChart({ ratingData }: RatingChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // 데이터 필터링
  const filteredData = ratingData.filter((item, index) => {
    if (selectedPeriod === '7d') return index >= ratingData.length - 7
    if (selectedPeriod === '30d') return index >= ratingData.length - 30
    return true
  })

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5" />
            평점 변화
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {filteredData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-300">현재 평점</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">
                      {filteredData[filteredData.length - 1]?.rating || 0}
                    </p>
                    <p className="text-sm text-gray-400">/ 5.0</p>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-300">리뷰 수</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredData[filteredData.length - 1]?.reviewCount?.toLocaleString() || 0}개
                  </p>
                </div>
              </div>

              {/* 평점 변화 그래프 */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={value =>
                        new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                      }
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 5]} tickFormatter={value => `${value}점`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                      labelFormatter={value => new Date(value).toLocaleDateString('ko-KR')}
                      formatter={(value: any) => [`${value}점`, '현재 평점']}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center text-gray-400">
                <p className="text-sm">기간: {selectedPeriod}</p>
                <p className="text-xs">데이터 포인트: {filteredData.length}개</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <Star className="mx-auto mb-2 h-12 w-12" />
                <p>평점 변화 차트</p>
                <p className="text-sm">데이터가 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 메인 컴포넌트
interface KeywordRankingChartsProps {
  reviewData: Array<{
    date: string
    reviewCount: number
    addedReviews: number
  }>
  priceData: Array<{
    date: string
    price: number
    originalPrice: number
    discountRate: number
  }>
  ratingData: Array<{
    date: string
    rating: number
    reviewCount: number
  }>
}

export default function KeywordRankingCharts({ reviewData, priceData, ratingData }: KeywordRankingChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ExpectedSalesChart />
      <ReviewChart reviewData={reviewData} />
      <PriceChart priceData={priceData} />
      <RatingChart ratingData={ratingData} />
    </div>
  )
}
