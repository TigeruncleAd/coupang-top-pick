'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table'
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'
import { getTrendKeywords } from '../trendServerAction'
import { toggleKeywordFavorite } from '../favoriteServerAction'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useMe } from '@/hooks/useMe'

interface TrendKeywordsViewProps {
  type: 'daily' | 'weekly'
  title: string
}

export default function TrendKeywordsView({ type, title }: TrendKeywordsViewProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()
  const { me } = useMe()

  const { data, isLoading, error } = useQuery({
    queryKey: ['trendKeywords', type],
    queryFn: getTrendKeywords,
  })

  // 즐겨찾기 토글 뮤테이션
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (keyword: string) => {
      if (!me?.id) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }
      const result = await toggleKeywordFavorite(keyword, me.id.toString())
      return { keyword, ...result }
    },
    onSuccess: result => {
      if (result.success) {
        // 로컬 상태 업데이트
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          if (result.isFavorite) {
            newFavorites.add(result.keyword)
          } else {
            newFavorites.delete(result.keyword)
          }
          return newFavorites
        })
        // 모든 즐겨찾기 관련 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: ['trendKeywords'] })
        queryClient.invalidateQueries({ queryKey: ['keywordHistory'] })
      }
    },
    onError: error => {
      console.error('즐겨찾기 토글 실패:', error)
    },
  })

  const handleToggleFavorite = (keyword: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavoriteMutation.mutate(keyword)
  }

  if (isLoading) {
    return (
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">로딩 중...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data?.result) {
    return (
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-400">데이터를 불러올 수 없습니다.</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const keywords = type === 'daily' ? data.result.daily : data.result.weekly

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-400" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '유지'
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getCompetitionLevel = (score: number) => {
    if (score >= 0.8) return { level: '매우 높음', color: 'text-red-400' }
    if (score >= 0.6) return { level: '높음', color: 'text-orange-400' }
    if (score >= 0.4) return { level: '보통', color: 'text-yellow-400' }
    if (score >= 0.2) return { level: '낮음', color: 'text-green-400' }
    return { level: '매우 낮음', color: 'text-blue-400' }
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {keywords.length === 0 ? (
          <div className="py-4 text-center text-gray-400">트렌드 키워드가 없습니다.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="w-12 text-gray-400">순위</TableHead>
                <TableHead className="w-8 text-gray-400">★</TableHead>
                <TableHead className="text-gray-400">키워드</TableHead>
                <TableHead className="text-gray-400">대표 카테고리</TableHead>
                <TableHead className="text-right text-gray-400">검색수</TableHead>
                <TableHead className="text-right text-gray-400">상품수</TableHead>
                <TableHead className="text-right text-gray-400">경쟁강도</TableHead>
                <TableHead className="text-center text-gray-400">변동</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((keyword, index) => {
                const competition = getCompetitionLevel(keyword.competitionScore)
                return (
                  <TableRow
                    key={index}
                    className="cursor-pointer border-gray-700 hover:bg-gray-700/50"
                    onClick={() => {
                      window.location.href = `/analyze/keyword/${encodeURIComponent(keyword.keyword)}`
                    }}>
                    <TableCell className="font-bold text-white">{keyword.rank}</TableCell>
                    <TableCell className="text-center">
                      <Star
                        className={`h-4 w-4 cursor-pointer transition-colors ${
                          keyword.isFavorite || favorites.has(keyword.keyword)
                            ? 'fill-current text-yellow-400 hover:text-yellow-300'
                            : 'text-gray-500 hover:text-yellow-400'
                        }`}
                        onClick={e => handleToggleFavorite(keyword.keyword, e)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-white">{keyword.keyword}</TableCell>
                    <TableCell className="text-gray-300">{keyword.category}</TableCell>
                    <TableCell className="text-right text-white">{keyword.searchVolume.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-white">{keyword.productCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={competition.color}>{competition.level}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getChangeIcon(keyword.change)}
                        <span className={`text-xs ${getChangeColor(keyword.change)}`}>
                          {getChangeText(keyword.change)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
