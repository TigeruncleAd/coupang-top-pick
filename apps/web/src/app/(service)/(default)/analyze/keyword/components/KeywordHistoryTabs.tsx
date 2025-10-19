'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table'
import { Star, Search, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getKeywordHistory, toggleKeywordFavorite, KeywordHistoryItem } from '../historyServerAction'

export default function KeywordHistoryTabs() {
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['keywordHistory'],
    queryFn: getKeywordHistory,
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleKeywordFavorite,
    onSuccess: () => {
      // 모든 즐겨찾기 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['keywordHistory'] })
      queryClient.invalidateQueries({ queryKey: ['trendKeywords'] })
    },
  })

  const handleToggleFavorite = (keywordId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavoriteMutation.mutate(keywordId)
  }

  const handleKeywordClick = (keyword: string) => {
    window.location.href = `/analyze/keyword/${encodeURIComponent(keyword)}`
  }

  if (isLoading) {
    return (
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">키워드 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">키워드 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-red-400">데이터를 불러오는데 실패했습니다.</div>
        </CardContent>
      </Card>
    )
  }

  const searchHistory = data?.result?.searchHistory || []
  const favorites = data?.result?.favorites || []

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="text-white">키워드 히스토리</CardTitle>
        <div className="flex space-x-1">
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            검색 내역 ({searchHistory.length})
          </Button>
          <Button
            variant={activeTab === 'favorites' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('favorites')}
            className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            즐겨찾기 ({favorites.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'history' ? (
          <KeywordList
            keywords={searchHistory}
            onToggleFavorite={handleToggleFavorite}
            onKeywordClick={handleKeywordClick}
          />
        ) : (
          <KeywordList
            keywords={favorites}
            onToggleFavorite={handleToggleFavorite}
            onKeywordClick={handleKeywordClick}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface KeywordListProps {
  keywords: KeywordHistoryItem[]
  onToggleFavorite: (keywordId: string, e: React.MouseEvent) => void
  onKeywordClick: (keyword: string) => void
}

function KeywordList({ keywords, onToggleFavorite, onKeywordClick }: KeywordListProps) {
  if (keywords.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        {keywords.length === 0 ? '키워드가 없습니다.' : '즐겨찾기 키워드가 없습니다.'}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-700 hover:bg-transparent">
          <TableHead className="w-12 text-gray-400">★</TableHead>
          <TableHead className="text-gray-400">키워드</TableHead>
          <TableHead className="text-right text-gray-400">상품수</TableHead>
          <TableHead className="text-right text-gray-400">검색수</TableHead>
          <TableHead className="text-gray-400">검색일시</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keywords.map(item => (
          <TableRow
            key={item.id}
            className="cursor-pointer border-gray-700 hover:bg-gray-700/50"
            onClick={() => onKeywordClick(item.keyword)}>
            <TableCell className="text-center">
              <Star
                className={`h-4 w-4 cursor-pointer transition-colors ${
                  item.isFavorite
                    ? 'fill-current text-yellow-400 hover:text-yellow-300'
                    : 'text-gray-500 hover:text-yellow-400'
                }`}
                onClick={e => onToggleFavorite(item.id, e)}
              />
            </TableCell>
            <TableCell className="font-medium text-white">{item.keyword}</TableCell>
            <TableCell className="text-right text-white">{item.productCount.toLocaleString()}</TableCell>
            <TableCell className="text-right text-white">{item.monthlySearchCount.toLocaleString()}</TableCell>
            <TableCell className="text-gray-300">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(item.searchedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
