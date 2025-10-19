'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'

// 카드 컴포넌트 import
import BasicInfoCard from './OverviewCards/BasicInfoCard'
import SalesInfoCard from './OverviewCards/SalesInfoCard'
import NaverProductIndexCard from './OverviewCards/NaverProductIndexCard'
import KeywordClassificationCard from './OverviewCards/KeywordClassificationCard'
import RelatedKeywordsCard from './OverviewCards/RelatedKeywordsCard'

interface BasicStats {
  productCount: number
  averagePrice: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  competitionScore: number
  searchVolume: number
  brandProtection: boolean
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface TrendData {
  date: string
  sales: number
  searchVolume: number
}

interface RelatedKeyword {
  query: string
  imageUrl: string
  searchVolume: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'VERY_LOW'
  productCount: number
  averagePrice: number
}

interface SalesInfoData {
  top10Sales: number
  top10Quantity: number
  top10AvgPrice: number
  top40Sales: number
  top40Quantity: number
  top40AvgPrice: number
}

interface OverviewProps {
  keyword: string
  basicStats: BasicStats
  trendData: TrendData[]
  relatedKeywords: RelatedKeyword[]
  salesInfoData: SalesInfoData
  brandInfo?: {
    isProtected: boolean
    brandName?: string
    protectionLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  onViewAllKeywords?: () => void
}

export default function Overview({
  keyword,
  basicStats,
  trendData,
  relatedKeywords,
  salesInfoData,
  brandInfo,
  onViewAllKeywords,
}: OverviewProps) {
  // 네이버 상품지표 데이터 생성 (실제 데이터 기반)
  const naverProductIndexData = {
    competitionScore: basicStats.competitionScore,
    competitionLevel: basicStats.competitionLevel,
    productCount: basicStats.productCount,
    searchCount: basicStats.searchVolume,
    realTransactionRatio: 0, // 실제로는 계산 필요
    bundleProductRatio: 0, // 실제로는 계산 필요
    overseasProductRatio: 0, // 실제로는 계산 필요
    recentPostRatio: 0, // 실제로는 계산 필요
    recentPostDetails: {
      oneMonth: 0,
      sixMonths: 0,
    },
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="space-y-6 lg:col-span-3">
        {/* 상단 기본 정보 카드들 - 가로 배치 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BasicInfoCard basicStats={basicStats} />
          <SalesInfoCard
            top10Data={{
              sales: salesInfoData.top10Sales,
              quantity: salesInfoData.top10Quantity,
              averagePrice: salesInfoData.top10AvgPrice,
            }}
            top40Data={{
              sales: salesInfoData.top40Sales,
              quantity: salesInfoData.top40Quantity,
              averagePrice: salesInfoData.top40AvgPrice,
            }}
          />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="space-y-6">
          {/* 상표 정보 */}
          {brandInfo?.isProtected && (
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-900/20 text-green-400">등록</Badge>
                    <CardTitle className="text-white">상표 정보</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    더보기
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-white">{brandInfo.brandName || keyword}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">귀금속 등(14류)</span>
                      <span className="text-sm text-white">등록: 3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">가죽 등(18류)</span>
                      <span className="text-sm text-white">등록: 3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">직물 등(24류)</span>
                      <span className="text-sm text-white">등록: 3</span>
                    </div>
                    <Button variant="link" className="p-0 text-blue-400 hover:text-blue-300">
                      외 16건 보기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 하단 지표 카드들 */}
          <div className="space-y-6">
            {/* 네이버 상품지표 - 실제 데이터 사용 */}
            <NaverProductIndexCard data={naverProductIndexData} />

            {/* 쿠팡 상품지표 - 임시 주석처리 */}
            {/* <CoupangProductIndexCard /> */}

            {/* 네이버 광고지표 - 임시 주석처리 */}
            {/* <NaverAdIndexCard /> */}
          </div>

          {/* 키워드 분류 */}
          <KeywordClassificationCard />
        </div>
      </div>
      {/* 연관 키워드 - 우측 사이드바 */}
      <div className="lg:col-span-1">
        <RelatedKeywordsCard relatedKeywords={relatedKeywords || []} onViewAll={onViewAllKeywords || (() => {})} />
      </div>
    </div>
  )
}
