'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Badge } from '@repo/ui/components/badge'
import { Loader2, Search, Database, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import {
  crawlShoppingPage,
  processExistingHTML,
  getUserCrawlingData,
} from '@/serverActions/analyze/shopping-crawler.actions'

interface CrawlResult {
  success: boolean
  message: string
  data?: {
    totalProducts: number
    savedProducts: number
    processingTime: number
    errors: string[]
  }
}

interface UserData {
  products: any[]
  malls: any[]
  logs: any[]
  stats: {
    totalProducts: number
    totalMalls: number
    totalLogs: number
    recentProducts: number
  }
}

export default function ShoppingCrawler() {
  const [keyword, setKeyword] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [isProcessingHTML, setIsProcessingHTML] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [saveToDb, setSaveToDb] = useState(true)
  const [saveParsedData, setSaveParsedData] = useState(true)

  const handleCrawl = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.')
      return
    }

    setIsCrawling(true)
    setCrawlResult(null)

    try {
      const result = await crawlShoppingPage({
        keyword: keyword.trim(),
        saveToDb,
        saveParsedData,
      })

      setCrawlResult(result)

      if (result.success) {
        // 성공 시 사용자 데이터 새로고침
        await loadUserData()
      }
    } catch (error) {
      setCrawlResult({
        success: false,
        message: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsCrawling(false)
    }
  }

  const handleProcessExistingHTML = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.')
      return
    }

    setIsProcessingHTML(true)
    setCrawlResult(null)

    try {
      // 기존 HTML 파일 경로 (식품.html)
      const htmlFilePath = '/Users/kimseonghyun/Desktop/projects/titan-tools-ui/apps/web/debug-html/식품.html'

      const result = await processExistingHTML(htmlFilePath, keyword.trim(), {
        saveToDb,
        saveParsedData,
      })

      setCrawlResult(result)

      if (result.success) {
        // 성공 시 사용자 데이터 새로고침
        await loadUserData()
      }
    } catch (error) {
      setCrawlResult({
        success: false,
        message: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsProcessingHTML(false)
    }
  }

  const loadUserData = async () => {
    setIsLoadingData(true)
    try {
      const result = await getUserCrawlingData()
      if (result.success && result.data) {
        setUserData(result.data)
      }
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 크롤링 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            네이버 쇼핑 크롤링
          </CardTitle>
          <CardDescription>키워드를 입력하여 네이버 쇼핑에서 상품 데이터를 수집하고 DB에 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="검색할 키워드를 입력하세요 (예: 식품, 건강식품)"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCrawl} disabled={isCrawling || !keyword.trim()} className="min-w-[120px]">
              {isCrawling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  크롤링 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  크롤링 시작
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveToDb}
                onChange={e => setSaveToDb(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">DB에 저장</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveParsedData}
                onChange={e => setSaveParsedData(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">파싱 데이터 저장</span>
            </label>
          </div>

          <div className="border-t pt-2">
            <Button
              onClick={handleProcessExistingHTML}
              disabled={isProcessingHTML || !keyword.trim()}
              variant="outline"
              className="w-full">
              {isProcessingHTML ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  HTML 처리 중...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  기존 HTML 파일 처리 (식품.html)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {crawlResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {crawlResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              크롤링 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className={`text-sm ${crawlResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {crawlResult.message}
              </p>

              {crawlResult.data && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{crawlResult.data.totalProducts}</div>
                    <div className="text-sm text-gray-600">총 상품 수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{crawlResult.data.savedProducts}</div>
                    <div className="text-sm text-gray-600">저장된 상품</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{crawlResult.data.errors.length}</div>
                    <div className="text-sm text-gray-600">오류 수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(crawlResult.data.processingTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-gray-600">처리 시간</div>
                  </div>
                </div>
              )}

              {crawlResult.data?.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-red-600">오류 목록:</h4>
                  <div className="space-y-1">
                    {crawlResult.data.errors.map((error, index) => (
                      <div key={index} className="rounded bg-red-50 p-2 text-xs text-red-500">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용자 데이터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            저장된 데이터
            <Button onClick={loadUserData} disabled={isLoadingData} variant="outline" size="sm">
              {isLoadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : '새로고침'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userData.stats.totalProducts}</div>
                  <div className="text-sm text-gray-600">총 상품</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userData.stats.totalMalls}</div>
                  <div className="text-sm text-gray-600">쇼핑몰</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{userData.stats.totalLogs}</div>
                  <div className="text-sm text-gray-600">크롤링 로그</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{userData.stats.recentProducts}</div>
                  <div className="text-sm text-gray-600">최근 7일</div>
                </div>
              </div>

              {userData.products.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">최근 수집된 상품:</h4>
                  <div className="space-y-2">
                    {userData.products.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between rounded bg-gray-50 p-2">
                        <div className="flex-1">
                          <div className="truncate text-sm font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.price?.toLocaleString()}원 • {product.mall?.mallName || '정보없음'}
                          </div>
                        </div>
                        <Badge variant={product.isAd ? 'default' : 'secondary'}>{product.isAd ? '광고' : '일반'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">데이터를 불러오는 중...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
