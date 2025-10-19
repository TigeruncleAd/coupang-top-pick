'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { BarChart3, Tag } from 'lucide-react'

interface Category {
  id: string
  name: string
  relevance: number
}

interface CategoryAnalysisProps {
  categories: Category[]
  nluTerms: Array<{ type: string; keyword: string }>
}

export default function CategoryAnalysis({ categories, nluTerms }: CategoryAnalysisProps) {
  const formatRelevance = (relevance: number) => {
    return (relevance * 100).toFixed(1) + '%'
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'bg-green-500'
    if (relevance >= 0.6) return 'bg-yellow-500'
    if (relevance >= 0.4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* NLU 용어 */}
      {nluTerms.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Tag className="h-5 w-5" />
              키워드 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {nluTerms.map((term, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="text-blue-400 border-blue-500"
                >
                  {term.type}: {term.keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 카테고리 분석 */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            카테고리 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.slice(0, 10).map((category, index) => (
              <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                <div className="flex-1">
                  <div className="text-white font-medium">{category.name}</div>
                  <div className="text-sm text-gray-400">ID: {category.id}</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {formatRelevance(category.relevance)}
                    </div>
                    <div className="text-xs text-gray-500">관련도</div>
                  </div>
                  
                  <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRelevanceColor(category.relevance)} transition-all duration-300`}
                      style={{ width: `${category.relevance * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categories.length > 10 && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-400">
                상위 10개 카테고리만 표시됩니다. 전체 {categories.length}개 카테고리
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
