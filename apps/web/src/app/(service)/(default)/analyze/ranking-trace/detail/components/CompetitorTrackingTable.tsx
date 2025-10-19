'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Badge } from '@repo/ui/components/badge'
import { TrendingUp, TrendingDown, Calendar, BarChart3, Search, Star } from 'lucide-react'

interface CompetitorTrackingData {
  id: string
  productName: string
  storeName: string
  date: string
  rank: number | null
  rankChange: number | null
  searchVolume: number | null
  searchVolumeChange: number | null
  rating: number | null
  reviewCount: number | null
}

interface CompetitorTrackingTableProps {
  data: CompetitorTrackingData[]
  onProductSelect: (productId: string) => void
}

type SortOption = 'default' | 'rankHigh' | 'rankLow' | 'searchHigh'

export default function CompetitorTrackingTable({ data, onProductSelect }: CompetitorTrackingTableProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [selectedDate, setSelectedDate] = useState('today')

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'default':
        return '기본순'
      case 'rankHigh':
        return '오늘 순위 높은순'
      case 'rankLow':
        return '오늘 순위 낮은순'
      case 'searchHigh':
        return '검색수 높은순'
      default:
        return '기본순'
    }
  }

  const getRankChangeIcon = (change: number | null) => {
    if (change == null) return <div className="h-3 w-3" />
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-400" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <div className="h-3 w-3" />
  }

  const getRankChangeColor = (change: number | null) => {
    if (change == null) return 'text-gray-400'
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getSearchVolumeChangeColor = (change: number | null) => {
    if (change == null) return 'text-gray-400'
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'rankHigh':
        return (a.rank || 999) - (b.rank || 999)
      case 'rankLow':
        return (b.rank || 0) - (a.rank || 0)
      case 'searchHigh':
        return (b.searchVolume || 0) - (a.searchVolume || 0)
      default:
        return 0
    }
  })

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            경쟁 상품 추적
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-32 border-gray-600 bg-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="yesterday">어제</SelectItem>
                <SelectItem value="week">이번 주</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40 border-gray-600 bg-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">기본순</SelectItem>
                <SelectItem value="rankHigh">오늘 순위 높은순</SelectItem>
                <SelectItem value="rankLow">오늘 순위 낮은순</SelectItem>
                <SelectItem value="searchHigh">검색수 높은순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3 text-left text-sm font-medium text-gray-300">날짜</th>
                <th className="p-3 text-left text-sm font-medium text-gray-300">상품명</th>
                <th className="p-3 text-left text-sm font-medium text-gray-300">판매점</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">순위</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">순위 변동</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">검색수</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">검색수 변동</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">평점</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">리뷰수</th>
                <th className="p-3 text-center text-sm font-medium text-gray-300">액션</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={index}
                  className="cursor-pointer border-b border-gray-700/50 hover:bg-gray-700/50"
                  onClick={() => onProductSelect(row.id)}>
                  <td className="p-3 text-sm text-gray-300">{row.date}</td>
                  <td className="max-w-xs truncate p-3 text-sm text-white">{row.productName}</td>
                  <td className="p-3 text-sm text-gray-300">{row.storeName}</td>
                  <td className="p-3 text-center text-sm text-white">{row.rank ? `${row.rank}위` : '-'}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getRankChangeIcon(row.rankChange)}
                      <span className={`text-sm ${getRankChangeColor(row.rankChange)}`}>
                        {row.rankChange != null ? (row.rankChange > 0 ? `+${row.rankChange}` : row.rankChange) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center text-sm text-white">{row.searchVolume?.toLocaleString() || '-'}</td>
                  <td className="p-3 text-center">
                    <span className={`text-sm ${getSearchVolumeChangeColor(row.searchVolumeChange)}`}>
                      {row.searchVolumeChange != null
                        ? row.searchVolumeChange > 0
                          ? `+${row.searchVolumeChange.toLocaleString()}`
                          : row.searchVolumeChange.toLocaleString()
                        : '-'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-sm text-white">{row.rating || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center text-sm text-gray-300">{row.reviewCount?.toLocaleString() || '-'}</td>
                  <td className="p-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        onProductSelect(row.id)
                      }}
                      className="border-blue-600 text-blue-300 hover:bg-blue-700">
                      <Search className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="py-8 text-center text-gray-400">
            <BarChart3 className="mx-auto mb-2 h-12 w-12" />
            <p>추적 데이터가 없습니다.</p>
            <p className="text-sm">경쟁 상품을 추가하고 추적을 시작해보세요.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
