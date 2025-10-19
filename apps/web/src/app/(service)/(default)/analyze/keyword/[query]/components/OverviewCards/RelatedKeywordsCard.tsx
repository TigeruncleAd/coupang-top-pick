'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table'
import { Link } from 'lucide-react'

interface RelatedKeyword {
  query: string
  imageUrl: string
  searchVolume: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'VERY_LOW'
  productCount: number
  averagePrice: number
}

interface RelatedKeywordsCardProps {
  relatedKeywords: RelatedKeyword[]
  onViewAll: () => void
}

export default function RelatedKeywordsCard({ relatedKeywords, onViewAll }: RelatedKeywordsCardProps) {
  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Link className="h-5 w-5" />
          연관 키워드
        </CardTitle>
      </CardHeader>
      <CardContent>
        {relatedKeywords.length === 0 ? (
          <div className="py-4 text-center text-gray-400">연관 키워드가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-400">키워드</TableHead>
                  <TableHead className="text-gray-400">검색수</TableHead>
                  <TableHead className="text-gray-400">상품수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedKeywords.slice(0, 20).map((query, index) => (
                  <TableRow
                    key={index}
                    className="cursor-pointer border-gray-700 hover:bg-gray-700/50"
                    onClick={() => {
                      window.location.href = `/analyze/keyword/${encodeURIComponent(query.query)}`
                    }}>
                    <TableCell className="text-white">
                      <span className="truncate text-sm">{query.query}</span>
                    </TableCell>
                    <TableCell>
                      {query.searchVolume ? (
                        <Badge variant="outline" className="border-blue-500 text-xs text-blue-400">
                          {query.searchVolume.toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {query.productCount ? (
                        <Badge variant="outline" className="border-green-500 text-xs text-green-400">
                          {query.productCount.toLocaleString()}개
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={onViewAll}>
              전체 보기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
