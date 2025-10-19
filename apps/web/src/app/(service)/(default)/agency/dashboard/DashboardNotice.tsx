'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Skeleton } from '@repo/ui/components/skeleton'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Bell, AlertTriangle, Megaphone, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useServerAction } from '@repo/utils'
import { getNotices } from '../notices/serverAction'

interface Notice {
  id: bigint
  createdAt: Date
  updatedAt: Date
  title: string
  content: string
  type: 'NORMAL' | 'URGENT'
}

export default function DashboardNotice() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { execute: executeGetNotices } = useServerAction(getNotices, {
    onSuccess: ({ data }) => {
      setNotices(data.notices.slice(0, 3)) // 최신 3개만 표시
      setIsLoading(false)
    },
    onError: ({ message }) => {
      toast.error(message)
      setIsLoading(false)
    },
  })

  useEffect(() => {
    executeGetNotices({ type: 'ALL', page: 1, limit: 3 })
  }, [])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
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
    return type === 'URGENT' ? <AlertTriangle className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />
  }

  const getNoticeStyle = (type: 'NORMAL' | 'URGENT') => {
    if (type === 'URGENT') {
      return 'rounded-lg border border-red-200 bg-red-50 p-3'
    }
    return 'rounded-lg border border-blue-200 bg-blue-50 p-3'
  }

  const getTextColor = (type: 'NORMAL' | 'URGENT') => {
    if (type === 'URGENT') {
      return {
        title: 'text-red-900',
        date: 'text-red-700',
      }
    }
    return {
      title: 'text-blue-900',
      date: 'text-blue-700',
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            공지사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border p-3">
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          공지사항
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length > 0 ? (
          <div className="space-y-3">
            {notices.map(notice => {
              const style = getNoticeStyle(notice.type)
              const colors = getTextColor(notice.type)

              return (
                <div key={notice.id.toString()} className={style}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${colors.title} line-clamp-2`}>{notice.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className={`h-3 w-3 ${colors.date}`} />
                        <span className={`text-xs ${colors.date}`}>{formatDate(notice.createdAt)}</span>
                        {notice.updatedAt.getTime() !== notice.createdAt.getTime() && (
                          <span className={`text-xs ${colors.date}`}>(수정됨)</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={getTypeVariant(notice.type)} className="flex items-center gap-1 text-xs">
                      {getTypeIcon(notice.type)}
                      {getTypeLabel(notice.type)}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>등록된 공지사항이 없습니다.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
