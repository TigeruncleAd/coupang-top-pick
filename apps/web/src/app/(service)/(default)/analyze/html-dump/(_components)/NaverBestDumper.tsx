'use client'

import { useState, useCallback } from 'react'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Loader2, Star, TrendingUp, Download, AlertCircle, CheckCircle, Eye, FileText } from 'lucide-react'
import { dumpHTMLOnly } from '@/serverActions/analyze/html-dump-only.actions'
import CategorySelector from '../../(_components)/CategorySelector'

interface HTMLDumpResult {
  success: boolean
  message: string
  url: string
  title: string
  htmlPath: string
  analysisPath: string
  error?: string
}

export default function NaverBestDumper() {
  const [isDumping, setIsDumping] = useState(false)
  const [dumpResult, setDumpResult] = useState<HTMLDumpResult | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('전체')

  // 카테고리 선택 핸들러
  const handleCategoryChange = useCallback((categoryId: string | null, categoryName: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedCategoryName(categoryName)
  }, [])

  const handleDumpHTML = async () => {
    setIsDumping(true)
    setDumpResult(null)

    try {
      const result = await dumpHTMLOnly(selectedCategoryId || undefined, selectedCategoryName)
      setDumpResult({
        success: true,
        message: `${selectedCategoryName} 카테고리 HTML 덤프 완료`,
        url: result.url,
        title: result.title,
        htmlPath: result.htmlPath,
        analysisPath: result.analysisPath || '',
      })
    } catch (error) {
      console.error('HTML 덤프 실패:', error)
      setDumpResult({
        success: false,
        message: `HTML 덤프 실패: ${error instanceof Error ? error.message : String(error)}`,
        url: '',
        title: '',
        htmlPath: '',
        analysisPath: '',
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsDumping(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          네이버 베스트 키워드 덤프
        </CardTitle>
        <CardDescription>
          네이버 쇼핑 베스트 키워드 페이지에서 전체 및 카테고리별 키워드 정보를 수집합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 카테고리 선택 */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-200">카테고리 선택</label>

          <CategorySelector onCategoryChange={handleCategoryChange} maxLevel={4} showAllOption={true} />

          {/* 덤프 버튼 */}
          <div className="pt-2">
            <Button onClick={handleDumpHTML} disabled={isDumping} className="flex items-center gap-2">
              {isDumping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  HTML 덤프 중...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {selectedCategoryName} HTML 덤프 시작
                </>
              )}
            </Button>
          </div>
        </div>

        {/* HTML 덤프 결과 */}
        {dumpResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {dumpResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${dumpResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {dumpResult.message}
              </span>
            </div>

            {dumpResult.success && (
              <div className="rounded-md bg-gray-800 p-3 text-sm">
                <div className="space-y-1">
                  <div>
                    <span className="font-medium text-gray-200">URL:</span>
                    <a
                      href={dumpResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-400 hover:text-blue-300 hover:underline">
                      {dumpResult.url}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium text-gray-200">제목:</span>
                    <span className="ml-1 text-gray-300">{dumpResult.title}</span>
                  </div>
                </div>
              </div>
            )}

            {/* HTML 파일 확인 버튼 */}
            {dumpResult.success && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {dumpResult.htmlPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileName = dumpResult.htmlPath?.split('/').pop()
                        if (fileName) {
                          window.open(`/api/debug-html/${fileName}`, '_blank')
                        }
                      }}
                      className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      HTML 파일 보기
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      HTML 파일 경로 없음
                    </div>
                  )}

                  {dumpResult.analysisPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileName = dumpResult.analysisPath?.split('/').pop()
                        if (fileName) {
                          window.open(`/api/debug-html/${fileName}`, '_blank')
                        }
                      }}
                      className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      분석 결과 보기
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      분석 파일 경로 없음
                    </div>
                  )}
                </div>

                {/* 파일 경로 정보 표시 */}
                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">HTML 파일:</span>{' '}
                      {dumpResult.htmlPath ? dumpResult.htmlPath.split('/').pop() : '생성되지 않음'}
                    </div>
                    <div>
                      <span className="font-medium">분석 파일:</span>{' '}
                      {dumpResult.analysisPath ? dumpResult.analysisPath.split('/').pop() : '생성되지 않음'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">HTML 덤프 기능</h4>
              <ul className="mt-1 space-y-1 text-sm text-blue-800">
                <li>• 카테고리를 선택하고 덤프 버튼을 클릭하면 해당 카테고리의 HTML을 덤프합니다</li>
                <li>• 전체: 모든 카테고리의 베스트 키워드 페이지를 덤프합니다</li>
                <li>• 특정 카테고리: 선택한 카테고리의 베스트 키워드 페이지만 덤프합니다</li>
                <li>• 덤프된 HTML 파일은 debug-html 폴더에 저장되어 확인할 수 있습니다</li>
                <li>• DB 저장 없이 순수하게 HTML 덤프만 수행합니다</li>
                <li>
                  • URL 형식:
                  https://snxbest.naver.com/keyword/best?categoryId=카테고리ID&sortType=KEYWORD_POPULAR&periodType=DAILY&ageType=ALL
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
