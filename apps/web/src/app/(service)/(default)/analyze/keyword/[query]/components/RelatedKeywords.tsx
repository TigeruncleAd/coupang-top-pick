'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { ExternalLink, TrendingUp, Search, Download, Filter, BarChart3, Users, Target, DollarSign } from 'lucide-react'

interface RelatedQuery {
  query: string
  imageUrl: string
  searchVolume?: number
  competitionLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  productCount?: number
  averagePrice?: number
}

interface RecommendTrend {
  gdid: string
  tags: Array<{
    gdid: string
    tagId: string
    imgUrl: string
    recInfo: string
    tagName: string
    tagReason: string
    searchVolume?: number
    trendScore?: number
  }>
}

interface RelatedKeywordsProps {
  keywordId: string
  platformSource: 'naver' | 'kakao' | 'coupang' | 'all'
  relatedQueries: RelatedQuery[]
  recommendTrend: RecommendTrend
  filters?: {
    gender?: 'all' | 'male' | 'female'
    age?: 'all' | '10s' | '20s' | '30s' | '40s' | '50s' | '60s+'
  }
  viewOptions?: {
    sortBy: 'search_volume' | 'competition' | 'alphabetical'
    showImages: boolean
  }
  onExport?: () => void
}

export default function RelatedKeywords({
  keywordId,
  platformSource = 'naver',
  relatedQueries,
  recommendTrend,
  filters = { gender: 'all', age: 'all' },
  viewOptions = { sortBy: 'search_volume', showImages: true },
  onExport,
}: RelatedKeywordsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(platformSource)
  const [selectedGender, setSelectedGender] = useState(filters.gender || 'all')
  const [selectedAge, setSelectedAge] = useState(filters.age || 'all')
  const [sortBy, setSortBy] = useState(viewOptions.sortBy || 'search_volume')
  const [showImages, setShowImages] = useState(viewOptions.showImages || true)

  const getCompetitionColor = (level?: string) => {
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

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'naver':
        return '네이버'
      case 'kakao':
        return '카카오'
      case 'coupang':
        return '쿠팡'
      case 'all':
        return '전체'
      default:
        return platform
    }
  }

  const sortedRelatedQueries = [...relatedQueries].sort((a, b) => {
    switch (sortBy) {
      case 'search_volume':
        return (b.searchVolume || 0) - (a.searchVolume || 0)
      case 'competition':
        const competitionOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 }
        return (
          (competitionOrder[b.competitionLevel as keyof typeof competitionOrder] || 0) -
          (competitionOrder[a.competitionLevel as keyof typeof competitionOrder] || 0)
        )
      case 'alphabetical':
        return a.query.localeCompare(b.query)
      default:
        return 0
    }
  })

  const sortedTrendTags = [...recommendTrend.tags].sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0))

  return (
    <div className="space-y-6">
      {/* 헤더 및 필터 */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold text-white">연관 키워드</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Download className="mr-2 h-4 w-4" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 플랫폼 및 필터 선택 */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedPlatform} onValueChange={value => setSelectedPlatform(value as any)}>
          <SelectTrigger className="w-32 border-gray-600 bg-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="naver">네이버</SelectItem>
            <SelectItem value="kakao">카카오</SelectItem>
            <SelectItem value="coupang">쿠팡</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedGender} onValueChange={value => setSelectedGender(value as any)}>
          <SelectTrigger className="w-24 border-gray-600 bg-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="male">남성</SelectItem>
            <SelectItem value="female">여성</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedAge} onValueChange={value => setSelectedAge(value as any)}>
          <SelectTrigger className="w-24 border-gray-600 bg-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="10s">10대</SelectItem>
            <SelectItem value="20s">20대</SelectItem>
            <SelectItem value="30s">30대</SelectItem>
            <SelectItem value="40s">40대</SelectItem>
            <SelectItem value="50s">50대</SelectItem>
            <SelectItem value="60s+">60대+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={value => setSortBy(value as any)}>
          <SelectTrigger className="w-32 border-gray-600 bg-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="search_volume">검색량순</SelectItem>
            <SelectItem value="competition">경쟁도순</SelectItem>
            <SelectItem value="alphabetical">가나다순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="related" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="related" className="data-[state=active]:bg-gray-700">
            연관 검색어 ({relatedQueries.length})
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-gray-700">
            추천 트렌드 ({recommendTrend.tags.length})
          </TabsTrigger>
        </TabsList>

        {/* 연관 검색어 탭 */}
        <TabsContent value="related" className="space-y-4">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-5 w-5" />
                {getPlatformName(selectedPlatform)} 연관 검색어
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedRelatedQueries.map((query, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-700/50"
                    onClick={() => {
                      window.location.href = `/analyze/keyword/${encodeURIComponent(query.query)}`
                    }}>
                    {showImages && query.imageUrl && (
                      <img src={query.imageUrl} alt={query.query} className="h-12 w-12 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{query.query}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {query.searchVolume && (
                          <Badge variant="outline" className="border-blue-500 text-xs text-blue-400">
                            검색량 {query.searchVolume.toLocaleString()}
                          </Badge>
                        )}
                        {query.competitionLevel && (
                          <Badge className={`text-xs ${getCompetitionColor(query.competitionLevel)}`}>
                            {query.competitionLevel}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        {query.productCount && <span>상품 {query.productCount.toLocaleString()}개</span>}
                        {query.averagePrice && <span>평균 ₩{query.averagePrice.toLocaleString()}</span>}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 추천 트렌드 탭 */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                추천 트렌드 태그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedTrendTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-700/50">
                    {showImages && tag.imgUrl && (
                      <img src={tag.imgUrl} alt={tag.tagName} className="h-12 w-12 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{tag.tagName}</p>
                      <p className="truncate text-sm text-gray-400">{tag.tagReason}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="border-purple-500 text-xs text-purple-400">
                          트렌드
                        </Badge>
                        {tag.trendScore && (
                          <Badge variant="outline" className="border-green-500 text-xs text-green-400">
                            점수 {tag.trendScore}
                          </Badge>
                        )}
                        {tag.searchVolume && (
                          <Badge variant="outline" className="border-blue-500 text-xs text-blue-400">
                            검색량 {tag.searchVolume.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">{tag.recInfo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
