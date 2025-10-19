'use client'
import { SearchedMall } from '@repo/database'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Badge } from '@repo/ui/components/badge'
import { Loader2 } from 'lucide-react'

interface MallCardProps {
  keyword: string
  totalCount: number
  crawledCount: number
  isSelected: boolean
  onSelect: (id: string, isSelected: boolean) => void
  onClick: () => void
}

export default function MallCard({ keyword, totalCount, crawledCount, isSelected, onSelect, onClick }: MallCardProps) {
  const processRate = Math.round((crawledCount / totalCount) * 100)
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent>
        <div className="flex items-center gap-4">
          <Checkbox checked={isSelected} onCheckedChange={checked => onSelect(keyword, checked as boolean)} />
          {/* <img
            src={mall.mallLogo || 'https://via.placeholder.com/150'}
            alt={mall.mallName}
            className="border-border h-12 w-12 rounded-full border object-cover"
          /> */}
          <div className="flex-grow space-y-1">
            <div
              // href={mall.mallPcUrl + '/category/ALL?cp=1'}
              // target="_blank"
              // rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-semibold transition-colors">
              {keyword}
            </div>
            <div className="text-muted-foreground text-sm">진행률 : {processRate}%</div>
            {/* <div className="text-sm">
              {isCurrentlyCrawling ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  <span className="font-bold text-blue-400">처리중...</span>
                </div>
              ) : mall.isComplete ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  완료
                </Badge>
              ) : (
                <Badge variant="secondary">미실행</Badge>
              )}
            </div> */}
          </div>
          <Button onClick={() => onClick()} variant="default" size="sm">
            상품 수집하기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
