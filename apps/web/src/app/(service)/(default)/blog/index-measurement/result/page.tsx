'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Separator } from '@repo/ui/components/separator'
import { Search, RotateCcw, TrendingUp, BarChart3, ChevronDown, ExternalLink, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar'
import BlogGauge from '../(_components)/blog-gauge'
import { measureBlogIndex } from '@/serverActions/blog/blog-index.actions'
import { BlogIndexMeasurementResponse } from '@/types/blog'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function IndexMeasurementResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [blogData, setBlogData] = useState<BlogIndexMeasurementResponse | null>(null)
  const [isPending, startTransition] = useTransition()
  const initialKeyword = searchParams.get('keyword') || ''

  useEffect(() => {
    setKeyword(initialKeyword)
    // 초기 키워드가 있으면 자동으로 검색
    if (initialKeyword) {
      handleMeasureBlogIndex(initialKeyword)
    }
  }, [initialKeyword])

  const handleMeasureBlogIndex = (searchKeyword: string) => {
    if (!searchKeyword.trim()) return

    startTransition(async () => {
      try {
        const result = await measureBlogIndex({ keyword: searchKeyword })
        setBlogData(result)

        if (!result.success) {
          toast.error(result.error || '블로그 지수 측정에 실패했습니다.')
        } else {
          toast.success('블로그 지수 측정이 완료되었습니다.')
        }
      } catch (error) {
        console.error('블로그 지수 측정 오류:', error)
        toast.error('블로그 지수 측정 중 오류가 발생했습니다.')
        setBlogData(null)
      }
    })
  }

  const handleSearch = () => {
    if (!keyword.trim()) return
    handleMeasureBlogIndex(keyword)
    router.push(`/blog/index-measurement/result?keyword=${encodeURIComponent(keyword)}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRefresh = () => {
    if (initialKeyword) {
      handleMeasureBlogIndex(initialKeyword)
    }
  }

  return (
    <div className="min-h-screen w-full space-y-6 text-white">
      {/* 헤더 검색 영역 */}
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="mb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-card/30 border-gray-600 text-gray-300 hover:text-white">
            내 블로그
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-card/30 border-gray-600 text-gray-300 hover:text-white">
            지수 조회
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-card/30 border-gray-600 text-gray-300 hover:text-white">
            누적 조회
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-card/30 border-gray-600 text-gray-300 hover:text-white">
            포스팅 분석
          </Button>
        </div>

        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={initialKeyword}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-card/30 border-gray-600 pr-10 text-white placeholder:text-gray-400"
          />
          <Button
            onClick={handleSearch}
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="hover:bg-border absolute right-1 top-1 h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-50">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 블로그 지수 결과 영역 */}
      {blogData && (
        <div className="bg-card border-border rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">블로그 지수 결과</h2>
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={isPending}
              className="bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:opacity-50">
              {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-1 h-3 w-3" />}
              {isPending ? '측정 중...' : '다시 측정'}
            </Button>
          </div>

          {blogData.success && blogData.data ? (
            <div className="space-y-4">
              {/* 블로그 기본 정보 */}
              <div className="bg-card/30 flex items-center gap-4 rounded-lg p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {blogData.data.blogInfo.blogName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{blogData.data.blogInfo.blogName}</h3>
                    {blogData.data.blogInfo.blogUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => window.open(blogData.data!.blogInfo.blogUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">블로그 ID: {blogData.data.blogInfo.blogId}</p>
                  {blogData.data.blogInfo.blogUrl && (
                    <p className="truncate text-sm text-blue-400">{blogData.data.blogInfo.blogUrl}</p>
                  )}
                </div>
              </div>

              {/* 지수 정보 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-card/30 rounded-lg p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-green-400">{blogData.data.blogIndex.topicIndex}</div>
                  <div className="text-sm text-gray-400">주제 지수</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-green-400">{blogData.data.blogIndex.overallIndex}</div>
                  <div className="text-sm text-gray-400">종합 지수</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-green-400">{blogData.data.blogIndex.maxIndex}</div>
                  <div className="text-sm text-gray-400">최고 지수</div>
                </div>
              </div>

              {/* 추가 정보 */}
              {blogData.data.optimizationMetrics && (
                <div className="bg-card/30 rounded-lg p-4">
                  <h4 className="mb-2 text-sm font-medium text-white">측정 상세 정보</h4>
                  <div className="text-sm text-gray-400">
                    <p>측정 점수: {blogData.data.optimizationMetrics.score.toFixed(4)}</p>
                    <p>계산된 등급: {blogData.data.optimizationMetrics.grade}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-red-400">{blogData.error || '알 수 없는 오류가 발생했습니다.'}</p>
            </div>
          )}
        </div>
      )}

      {/* 로딩 상태 */}
      {isPending && !blogData && (
        <div className="bg-card border-border rounded-lg border p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-white">블로그 지수를 측정하고 있습니다...</span>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="bg-card border-border rounded-lg border p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="mr-2 text-lg font-medium text-white">지수조회</h2>
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-xs text-white">
              ?
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" className="bg-blue-600 px-4 text-white hover:bg-blue-700">
              <RotateCcw className="mr-1 h-3 w-3" />
              지수 갱신
            </Button>
            <div className="text-sm text-gray-400">최근 업데이트: 4일 전</div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 좌측 통계 */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-orange-500 text-xs text-white">봉</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-white">봉이(bongbong_bubu)</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-2 text-xs text-gray-400">블로그명</div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold text-white">2009-03-09</div>
                <div className="text-xs text-gray-500">블로그 생성일</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-white">11,685,006</div>
                <div className="text-xs text-gray-500">총 방문자</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-white">1,460</div>
                <div className="text-xs text-gray-500">총 포스팅</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-white">13,179</div>
                <div className="text-xs text-gray-500">총 구독자</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6">
              {/* 반원형 게이지 */}
              <BlogGauge currentGrade="준최2" />
            </div>

            {/* 주제별 포스팅 개수 */}
            <div className="mb-6 w-full">
              <Button
                variant="outline"
                className="hover:bg-border bg-card/30 w-full justify-between border-gray-600 text-gray-300">
                주제별 포스팅 개수
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid w-full grid-cols-2 gap-8 text-center">
              <div>
                <div className="font-medium text-white">25,237등(상위 62.2%)</div>
                <div className="text-xs text-gray-400">블랙스 주제 랭킹</div>
              </div>
              <div>
                <div className="font-medium text-white">710,489등(상위 47.9%)</div>
                <div className="text-xs text-gray-400">블랙스 전체 랭킹</div>
              </div>
            </div>
          </div>

          {/* 우측 통계 */}
          <div className="space-y-6 text-right">
            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold text-green-400">준최1</div>
                <div className="text-xs text-gray-500">주제 지수</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-green-400">준최2</div>
                <div className="text-xs text-gray-500">종합 지수</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-green-400">준최2</div>
                <div className="text-xs text-gray-500">최고 지수</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-white">국내여행</div>
                <div className="text-xs text-gray-500">블로그 주제</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border border-t pt-6">
          <h3 className="mb-2 text-lg font-semibold text-white">최적화 수치</h3>
          <p className="mb-6 text-sm leading-relaxed text-gray-400">
            현재 네이버에서 사용자마다 검색결과를 다르게 나오는 실험중입니다. 이에 따라 최적화 수치라는 값이 변동이 심한
            상태입니다. 안정화되면 다시 표시하겠습니다. 지수 부분은 변동이 없습니다.
          </p>

          {/* 최적화 차트 */}
          <div className="border-border bg-card/30 flex h-32 items-center justify-center rounded-lg border">
            <div className="text-center text-gray-400">
              <BarChart3 className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">최적화 차트</p>
            </div>
          </div>
        </div>
      </div>
      {/* 메인 콘텐츠 영역 끝 */}

      {/* 하단 차트 영역 */}
      <div className="space-y-6">
        {/* 지수 히스토리 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              지수 히스토리
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs">ℹ</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border bg-card/30 flex h-32 items-center justify-center rounded-lg border">
              <div className="text-center text-gray-400">
                <BarChart3 className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">지수 히스토리 차트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 전체 랭킹 히스토리 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              전체 랭킹 히스토리
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs">ℹ</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border bg-card/30 flex h-48 items-center justify-center rounded-lg border">
              <div className="text-center text-gray-400">
                <TrendingUp className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">전체 랭킹 히스토리 차트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리 랭킹 히스토리 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              카테고리 랭킹 히스토리
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs">ℹ</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border bg-card/30 flex h-48 items-center justify-center rounded-lg border">
              <div className="text-center text-gray-400">
                <BarChart3 className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">카테고리 랭킹 히스토리 차트</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
