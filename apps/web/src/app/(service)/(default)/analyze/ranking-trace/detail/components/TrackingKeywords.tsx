'use client'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Edit3 } from 'lucide-react'

interface TrackingKeywordsProps {
  keywords: Array<{
    id: string
    keyword: string
    market: string
    createdAt: string
  }>
  onOpenModal: () => void
}

export function TrackingKeywords({ keywords, onOpenModal }: TrackingKeywordsProps) {
  return (
    <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">추적 키워드</h3>
        <Button
          onClick={onOpenModal}
          variant="outline"
          size="sm"
          className="border-gray-500 text-gray-300 hover:bg-gray-600">
          <Edit3 className="mr-2 h-4 w-4" />
          추가/편집
        </Button>
      </div>

      <div className="space-y-2">
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map(keyword => (
              <Badge key={keyword.id} variant="outline" className="border-blue-500 text-blue-400">
                {keyword.keyword}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            추적 키워드가 없습니다. 추가/편집 버튼을 클릭하여 키워드를 추가해보세요.
          </p>
        )}
      </div>
    </div>
  )
}
