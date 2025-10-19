'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { HelpCircle } from 'lucide-react'

interface KeywordClassificationCardProps {
  // 실제 데이터가 없으므로 임시로 샘플 데이터 사용
  sectionRank?: number
  tabRank?: number
  categories?: string[]
}

export default function KeywordClassificationCard({
  sectionRank = 3,
  tabRank = 3,
  categories = ['상세정보', '웹사이트', '쇼핑', '플러스스토어', '웹사이트'],
}: KeywordClassificationCardProps) {
  const tabCategories = ['이미지', '카페', '쇼핑', '블로그', '동영상', '지식iN', '인플루언서', '뉴스']

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-900/20 text-blue-400">쇼핑성</Badge>
            <CardTitle className="text-white">키워드 분류</CardTitle>
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            더보기
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-gray-400">섹션:</span>
              <Badge variant="outline" className="border-gray-500 text-gray-300">
                {sectionRank}위
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item, index) => (
                <Button
                  key={index}
                  variant={item === '쇼핑' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    item === '쇼핑' ? 'bg-blue-600 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }>
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-gray-400">탭:</span>
              <Badge variant="outline" className="border-gray-500 text-gray-300">
                {tabRank}위
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {tabCategories.map((item, index) => (
                <Button
                  key={index}
                  variant={item === '쇼핑' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    item === '쇼핑' ? 'bg-blue-600 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
