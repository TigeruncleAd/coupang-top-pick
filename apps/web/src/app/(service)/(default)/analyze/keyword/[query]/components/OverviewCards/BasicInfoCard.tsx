'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'

interface BasicStats {
  productCount: number
  searchVolume: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  competitionScore: number
}

interface BasicInfoCardProps {
  basicStats: BasicStats
}

export default function BasicInfoCard({ basicStats }: BasicInfoCardProps) {
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-blue-400 bg-blue-900/20'
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

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">상품수</span>
            <span className="text-2xl font-bold text-white">{basicStats.productCount.toLocaleString()} 개</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">한 달 검색수</span>
            <span className="text-2xl font-bold text-white">{basicStats.searchVolume.toLocaleString()} 회</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">경쟁강도</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{basicStats.competitionScore.toFixed(2)}</span>
              <Badge className={getCompetitionColor(basicStats.competitionLevel)}>
                {getCompetitionText(basicStats.competitionLevel)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
