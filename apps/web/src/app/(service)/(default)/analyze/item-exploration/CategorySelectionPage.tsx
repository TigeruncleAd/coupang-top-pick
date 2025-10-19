'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import CategorySelector from '../(_components)/CategorySelector'

export default function CategorySelectionPage() {
  const router = useRouter()

  // 카테고리 선택 핸들러
  const handleCategoryChange = (categoryId: string | null, categoryName: string) => {
    // 카테고리가 선택되면 바로 분석 페이지로 이동
    if (categoryId && categoryId !== 'all') {
      router.push(`/analyze/item-exploration/${categoryId}`)
    }
  }

  return (
    <div className="container mx-auto space-y-4 p-4">
      {/* 다크 테마로 통일 */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            카테고리 선택
          </CardTitle>
          <CardDescription className="text-gray-400">
            분석할 카테고리를 선택하세요. 더 구체적인 카테고리를 선택할수록 정확한 분석 결과를 얻을 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 사용법 안내 */}
          <div className="rounded-lg border border-blue-500 bg-blue-900/20 p-4">
            <h3 className="mb-2 text-sm font-medium text-blue-200">사용법</h3>
            <div className="space-y-1 text-sm text-blue-100">
              <p>• 1차 분류부터 차례대로 선택하세요</p>
              <p>• 더 구체적인 분류를 선택할수록 정확한 키워드를 얻을 수 있습니다</p>
              <p>• 카테고리 선택 시 자동으로 분석 페이지로 이동합니다</p>
            </div>
          </div>

          {/* 카테고리 선택기 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">카테고리 선택</label>
            <CategorySelector
              onCategoryChange={handleCategoryChange}
              placeholder="분석할 카테고리를 선택하세요"
              showAllOption={false}
              maxLevel={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
