'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Skeleton } from '@repo/ui/components/skeleton'
import { AlertTriangle, Megaphone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useServerAction } from '@repo/utils'

interface Notice {
  id: bigint
  createdAt: Date
  updatedAt: Date
  title: string
  content: string
  type: 'NORMAL' | 'URGENT'
}

interface NoticeListData {
  notices: Notice[]
  totalCount: number
  totalPages: number
  currentPage: number
}

interface NoticeListProps {
  getNoticesAction: any // 서버 액션 함수
}

export default function NoticeList({ getNoticesAction }: NoticeListProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'NORMAL' | 'URGENT'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [noticeData, setNoticeData] = useState<NoticeListData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { execute: executeGetNotices } = useServerAction(getNoticesAction, {
    onSuccess: ({ data }) => {
      setNoticeData(data as NoticeListData)
      setIsLoading(false)
    },
    onError: ({ message }) => {
      toast.error(message)
      setIsLoading(false)
    },
  })

  const loadNotices = () => {
    setIsLoading(true)
    executeGetNotices({ type: filterType, page: currentPage, limit: 10 })
  }

  useEffect(() => {
    loadNotices()
  }, [filterType, currentPage])

  const handleFilterChange = (value: 'ALL' | 'NORMAL' | 'URGENT') => {
    setFilterType(value)
    setCurrentPage(1) // 필터 변경 시 첫 페이지로
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getTypeLabel = (type: 'NORMAL' | 'URGENT') => {
    return type === 'URGENT' ? '긴급' : '일반'
  }

  const getTypeVariant = (type: 'NORMAL' | 'URGENT') => {
    return type === 'URGENT' ? 'destructive' : 'secondary'
  }

  const getTypeIcon = (type: 'NORMAL' | 'URGENT') => {
    return type === 'URGENT' ? <AlertTriangle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />
  }

  if (isLoading && !noticeData) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">공지사항</h1>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="URGENT">긴급</SelectItem>
              <SelectItem value="NORMAL">일반</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 공지 목록 */}
      {noticeData && noticeData.notices.length > 0 ? (
        <div className="space-y-4">
          {noticeData.notices.map(notice => (
            <Card key={notice.id.toString()} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="mb-2 line-clamp-2 text-lg">{notice.title}</CardTitle>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(notice.createdAt)}</span>
                      {notice.updatedAt.getTime() !== notice.createdAt.getTime() && (
                        <span className="text-xs text-orange-600">(수정됨)</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={getTypeVariant(notice.type)} className="flex items-center gap-1">
                    {getTypeIcon(notice.type)}
                    {getTypeLabel(notice.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground line-clamp-3">{notice.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <Megaphone className="h-4 w-4" />
          <AlertDescription>
            {filterType === 'ALL'
              ? '등록된 공지사항이 없습니다.'
              : `${getTypeLabel(filterType as 'NORMAL' | 'URGENT')} 공지사항이 없습니다.`}
          </AlertDescription>
        </Alert>
      )}

      {/* 페이지네이션 */}
      {noticeData && noticeData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, noticeData.totalPages) }, (_, i) => {
              let pageNum
              if (noticeData.totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= noticeData.totalPages - 2) {
                pageNum = noticeData.totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0">
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === noticeData.totalPages || isLoading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 페이지 정보 */}
      {noticeData && (
        <div className="text-muted-foreground text-center text-sm">
          {noticeData.totalCount}개의 공지사항 중 {(currentPage - 1) * 10 + 1}-
          {Math.min(currentPage * 10, noticeData.totalCount)}번째 표시
        </div>
      )}
    </div>
  )
}
