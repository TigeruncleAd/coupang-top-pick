'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { HelpCircle } from 'lucide-react'

interface NaverProductIndexData {
  competitionScore: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  productCount: number
  searchCount: number
  realTransactionRatio: number
  bundleProductRatio: number
  overseasProductRatio: number
  recentPostRatio: number
  recentPostDetails: {
    oneMonth: number
    sixMonths: number
  }
}

interface NaverProductIndexCardProps {
  data: NaverProductIndexData
}

export default function NaverProductIndexCard({ data }: NaverProductIndexCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case '아주좋음':
        return 'text-blue-400 bg-blue-900/20'
      case '좋음':
        return 'text-green-400 bg-green-900/20'
      case '보통':
        return 'text-yellow-400 bg-yellow-900/20'
      case '나쁨':
        return 'text-orange-400 bg-orange-900/20'
      case '아주나쁨':
        return 'text-red-400 bg-red-900/20'
      default:
        return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getCompetitionText = (level: string) => {
    switch (level) {
      case 'LOW':
        return '아주좋음'
      case 'MEDIUM':
        return '좋음'
      case 'HIGH':
        return '보통'
      case 'VERY_HIGH':
        return '나쁨'
      default:
        return '보통'
    }
  }

  const getRatioStatus = (ratio: number, type: 'real' | 'bundle' | 'overseas' | 'recent') => {
    switch (type) {
      case 'real':
        if (ratio >= 80) return '아주좋음'
        if (ratio >= 60) return '좋음'
        if (ratio >= 40) return '보통'
        return '나쁨'
      case 'bundle':
        if (ratio <= 20) return '아주좋음'
        if (ratio <= 40) return '좋음'
        if (ratio <= 60) return '보통'
        return '나쁨'
      case 'overseas':
        if (ratio <= 10) return '아주좋음'
        if (ratio <= 20) return '좋음'
        if (ratio <= 30) return '보통'
        return '나쁨'
      case 'recent':
        if (ratio >= 80) return '아주좋음'
        if (ratio >= 60) return '좋음'
        if (ratio >= 40) return '보통'
        return '나쁨'
      default:
        return '보통'
    }
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor('좋음')}>좋음</Badge>
            <CardTitle className="text-white">네이버 상품지표</CardTitle>
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="text-center">
            <p className="text-sm text-gray-400">경쟁강도</p>
            <p className="text-lg font-bold text-white">{data.competitionScore.toFixed(2)}</p>
            <Badge className={`mt-1 ${getStatusColor(getCompetitionText(data.competitionLevel))}`}>
              {getCompetitionText(data.competitionLevel)}
            </Badge>
            <p className="mt-1 text-xs text-gray-500">
              상품수 {data.productCount.toLocaleString()}개 ÷ 검색수 {data.searchCount.toLocaleString()}회
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">실거래상품 비율</p>
            <p className="text-lg font-bold text-white">{data.realTransactionRatio}%</p>
            <Badge className={`mt-1 ${getStatusColor(getRatioStatus(data.realTransactionRatio, 'real'))}`}>
              {getRatioStatus(data.realTransactionRatio, 'real')}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">묶음상품 비율</p>
            <p className="text-lg font-bold text-white">{data.bundleProductRatio}%</p>
            <Badge className={`mt-1 ${getStatusColor(getRatioStatus(data.bundleProductRatio, 'bundle'))}`}>
              {getRatioStatus(data.bundleProductRatio, 'bundle')}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">해외상품 비율</p>
            <p className="text-lg font-bold text-white">{data.overseasProductRatio}%</p>
            <Badge className={`mt-1 ${getStatusColor(getRatioStatus(data.overseasProductRatio, 'overseas'))}`}>
              {getRatioStatus(data.overseasProductRatio, 'overseas')}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">1년 내 게시 비율</p>
            <p className="text-lg font-bold text-white">{data.recentPostRatio}%</p>
            <Badge className={`mt-1 ${getStatusColor(getRatioStatus(data.recentPostRatio, 'recent'))}`}>
              {getRatioStatus(data.recentPostRatio, 'recent')}
            </Badge>
            <p className="mt-1 text-xs text-gray-500">
              {data.recentPostDetails.oneMonth}개월 {data.recentPostDetails.sixMonths}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
