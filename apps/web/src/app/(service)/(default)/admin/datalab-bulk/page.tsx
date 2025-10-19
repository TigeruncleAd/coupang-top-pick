'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Progress } from '@repo/ui/components/progress'
import { Badge } from '@repo/ui/components/badge'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Loader2, Play, CheckCircle, XCircle, Clock, Database } from 'lucide-react'

interface CategoryResult {
  categoryId: string
  categoryName: string
  smartStoreId: string
  level: number
  success: boolean
  keywordCount: number
  processingTime: number
  error?: string
}

interface BulkProcessResult {
  success: boolean
  totalCategories: number
  successfulCategories: number
  failedCategories: number
  totalKeywords: number
  totalProcessingTime: number
  results: CategoryResult[]
  errors?: string[]
  message?: string
}

export default function DataLabBulkPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<BulkProcessResult | null>(null)
  const [settings, setSettings] = useState({
    categoryLevels: [1, 2, 3, 4],
    maxPages: 25,
    concurrencyLimit: 5,
    saveToDatabase: false,
    timeUnit: 'date',
    gender: '',
    ageGroup: '',
    device: '',
    count: '20',
  })

  const handleProcess = async () => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/datalab-all-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('처리 중 오류:', error)
      setResult({
        success: false,
        totalCategories: 0,
        successfulCategories: 0,
        failedCategories: 0,
        totalKeywords: 0,
        totalProcessingTime: 0,
        results: [],
        errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
        message: '처리 중 오류가 발생했습니다.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const successRate = result ? (result.successfulCategories / result.totalCategories) * 100 : 0

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DataLab 대량 처리</h1>
          <p className="text-muted-foreground">모든 카테고리에 대해 데이터랩 키워드를 병렬로 수집합니다</p>
        </div>
        <Button onClick={handleProcess} disabled={isProcessing} size="lg" className="gap-2">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              처리 시작
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 설정 패널 */}
        <Card>
          <CardHeader>
            <CardTitle>처리 설정</CardTitle>
            <CardDescription>카테고리 및 처리 옵션을 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>처리할 카테고리 레벨</Label>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={settings.categoryLevels.includes(level)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSettings(prev => ({
                            ...prev,
                            categoryLevels: [...prev.categoryLevels, level].sort(),
                          }))
                        } else {
                          setSettings(prev => ({
                            ...prev,
                            categoryLevels: prev.categoryLevels.filter(l => l !== level),
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={`level-${level}`}>{level}차 카테고리</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPages">페이지 수</Label>
                <Input
                  id="maxPages"
                  type="number"
                  value={settings.maxPages}
                  onChange={e => setSettings(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 25 }))}
                  min="1"
                  max="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="concurrencyLimit">동시 처리 수</Label>
                <Input
                  id="concurrencyLimit"
                  type="number"
                  value={settings.concurrencyLimit}
                  onChange={e => setSettings(prev => ({ ...prev, concurrencyLimit: parseInt(e.target.value) || 5 }))}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeUnit">시간 단위</Label>
              <Select
                value={settings.timeUnit}
                onValueChange={value => setSettings(prev => ({ ...prev, timeUnit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">일별</SelectItem>
                  <SelectItem value="week">주별</SelectItem>
                  <SelectItem value="month">월별</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveToDatabase"
                checked={settings.saveToDatabase}
                onCheckedChange={checked => setSettings(prev => ({ ...prev, saveToDatabase: !!checked }))}
              />
              <Label htmlFor="saveToDatabase">데이터베이스에 저장</Label>
            </div>
          </CardContent>
        </Card>

        {/* 결과 패널 */}
        <Card>
          <CardHeader>
            <CardTitle>처리 결과</CardTitle>
            <CardDescription>대량 처리 결과를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-muted-foreground py-8 text-center">처리 버튼을 클릭하여 시작하세요</div>
            ) : (
              <div className="space-y-4">
                {/* 전체 통계 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.totalCategories}</div>
                    <div className="text-muted-foreground text-sm">총 카테고리</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.successfulCategories}</div>
                    <div className="text-muted-foreground text-sm">성공</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{result.failedCategories}</div>
                    <div className="text-muted-foreground text-sm">실패</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.totalKeywords}</div>
                    <div className="text-muted-foreground text-sm">총 키워드</div>
                  </div>
                </div>

                {/* 성공률 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>성공률</span>
                    <span>{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>

                {/* 처리 시간 */}
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>처리 시간: {(result.totalProcessingTime / 1000).toFixed(1)}초</span>
                </div>

                {/* 메시지 */}
                {result.message && (
                  <Alert>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                )}

                {/* 오류 목록 */}
                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label>오류 목록</Label>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div key={index} className="rounded bg-red-50 p-2 text-sm text-red-600">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상세 결과 */}
      {result && result.results && result.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 상세 결과</CardTitle>
            <CardDescription>각 카테고리의 처리 결과를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {result.results.map((categoryResult, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {categoryResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{categoryResult.categoryName}</div>
                      <div className="text-muted-foreground text-sm">
                        레벨 {categoryResult.level} • {categoryResult.smartStoreId}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={categoryResult.success ? 'default' : 'destructive'}>
                      {categoryResult.keywordCount}개
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {(categoryResult.processingTime / 1000).toFixed(1)}초
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
