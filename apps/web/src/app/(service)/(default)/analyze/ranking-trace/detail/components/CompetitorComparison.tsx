'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Badge } from '@repo/ui/components/badge'
import { BarChart3, TrendingUp, Star, DollarSign, Users, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ComparisonData {
  myProduct: {
    id: string
    name: string
    price: number
    rating: number
    reviewCount: number
    expectedSales: number
    salesData: Array<{ date: string; value: number }>
    ratingData: Array<{ date: string; value: number }>
    reviewData: Array<{ date: string; value: number }>
  }
  competitorProduct: {
    id: string
    name: string
    price: number
    rating: number
    reviewCount: number
    expectedSales: number
    salesData: Array<{ date: string; value: number }>
    ratingData: Array<{ date: string; value: number }>
    reviewData: Array<{ date: string; value: number }>
  }
}

interface CompetitorComparisonProps {
  myProduct: ComparisonData['myProduct']
  competitorProducts: Array<{
    id: string
    name: string
    price: number
    rating: number
    reviewCount: number
    expectedSales: number
    salesData: Array<{ date: string; value: number }>
    ratingData: Array<{ date: string; value: number }>
    reviewData: Array<{ date: string; value: number }>
  }>
  onSelectCompetitor: (competitorId: string) => void
}

export default function CompetitorComparison({
  myProduct,
  competitorProducts,
  onSelectCompetitor,
}: CompetitorComparisonProps) {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('')
  const [comparisonType, setComparisonType] = useState<'sales' | 'rating' | 'reviews'>('sales')

  const selectedCompetitor = competitorProducts?.find(p => p.id === selectedCompetitorId)

  const handleCompetitorSelect = (competitorId: string) => {
    setSelectedCompetitorId(competitorId)
    onSelectCompetitor(competitorId)
  }

  const getComparisonData = () => {
    if (!selectedCompetitor) return []

    const myData = myProduct[`${comparisonType}Data` as keyof typeof myProduct] as Array<{
      date: string
      value: number
    }>
    const competitorData = selectedCompetitor[`${comparisonType}Data` as keyof typeof selectedCompetitor] as Array<{
      date: string
      value: number
    }>

    // 최근 7일 데이터로 제한
    const recentDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    return recentDates.map(date => ({
      date,
      내상품: myData?.find(d => d.date === date)?.value || 0,
      경쟁상품: competitorData?.find(d => d.date === date)?.value || 0,
    }))
  }

  const getComparisonTitle = () => {
    switch (comparisonType) {
      case 'sales':
        return '예상 판매량 비교'
      case 'rating':
        return '평점 비교'
      case 'reviews':
        return '리뷰 수 비교'
      default:
        return '비교 분석'
    }
  }

  const getComparisonIcon = () => {
    switch (comparisonType) {
      case 'sales':
        return <TrendingUp className="h-5 w-5" />
      case 'rating':
        return <Star className="h-5 w-5" />
      case 'reviews':
        return <Users className="h-5 w-5" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }

  const comparisonData = getComparisonData()

  // competitorProducts가 없거나 비어있을 때 처리
  if (!competitorProducts || competitorProducts.length === 0) {
    return (
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5" />
            비교 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-400">
            <Target className="mx-auto mb-2 h-12 w-12" />
            <p>비교할 경쟁 상품이 없습니다.</p>
            <p className="text-sm">경쟁 상품을 먼저 추가해주세요.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            {getComparisonIcon()}
            {getComparisonTitle()}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedCompetitorId} onValueChange={handleCompetitorSelect}>
              <SelectTrigger className="w-48 border-gray-600 bg-gray-700 text-white">
                <SelectValue placeholder="경쟁 상품 선택" />
              </SelectTrigger>
              <SelectContent>
                {competitorProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={comparisonType} onValueChange={value => setComparisonType(value as any)}>
              <SelectTrigger className="w-32 border-gray-600 bg-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">판매량</SelectItem>
                <SelectItem value="rating">평점</SelectItem>
                <SelectItem value="reviews">리뷰수</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedCompetitor ? (
          <div className="py-8 text-center text-gray-400">
            <Target className="mx-auto mb-2 h-12 w-12" />
            <p>비교할 경쟁 상품을 선택해주세요.</p>
            <p className="text-sm">1대1 비교 분석을 시작할 수 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 상품 정보 비교 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* 내 상품 */}
              <div className="rounded-lg bg-blue-900/20 p-4">
                <h3 className="mb-3 text-lg font-medium text-blue-300">내 상품</h3>
                <div className="space-y-2">
                  <p className="font-medium text-white">{myProduct.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">{myProduct.price.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-gray-300">{myProduct.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">{myProduct.reviewCount.toLocaleString()}개</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">{myProduct.expectedSales.toLocaleString()}개</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 경쟁 상품 */}
              <div className="rounded-lg bg-red-900/20 p-4">
                <h3 className="mb-3 text-lg font-medium text-red-300">경쟁 상품</h3>
                <div className="space-y-2">
                  <p className="font-medium text-white">{selectedCompetitor.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">{selectedCompetitor.price.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-gray-300">{selectedCompetitor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">{selectedCompetitor.reviewCount.toLocaleString()}개</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300">{selectedCompetitor.expectedSales.toLocaleString()}개</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 비교 차트 */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="내상품"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="경쟁상품"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 요약 통계 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-700/50 p-4">
                <h4 className="mb-2 text-sm font-medium text-gray-300">가격 차이</h4>
                <p className="text-lg font-bold text-white">
                  {Math.abs(myProduct.price - selectedCompetitor.price).toLocaleString()}원
                </p>
                <p className="text-xs text-gray-400">
                  {myProduct.price > selectedCompetitor.price ? '더 비쌈' : '더 저렴함'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-700/50 p-4">
                <h4 className="mb-2 text-sm font-medium text-gray-300">평점 차이</h4>
                <p className="text-lg font-bold text-white">
                  {Math.abs(myProduct.rating - selectedCompetitor.rating).toFixed(1)}
                </p>
                <p className="text-xs text-gray-400">
                  {myProduct.rating > selectedCompetitor.rating ? '더 높음' : '더 낮음'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-700/50 p-4">
                <h4 className="mb-2 text-sm font-medium text-gray-300">리뷰 수 차이</h4>
                <p className="text-lg font-bold text-white">
                  {Math.abs(myProduct.reviewCount - selectedCompetitor.reviewCount).toLocaleString()}개
                </p>
                <p className="text-xs text-gray-400">
                  {myProduct.reviewCount > selectedCompetitor.reviewCount ? '더 많음' : '더 적음'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
