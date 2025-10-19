'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { useMe } from '../../../../../../hooks/useMe'
import { kdayjs } from '@repo/utils'
import { User, Calendar, Search } from 'lucide-react'

export default function DashboardUserProfile() {
  const { me, isLoading } = useMe()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!me) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">사용자 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  const isExpired = kdayjs(me.expiredAt).isBefore(kdayjs())
  const daysUntilExpiry = kdayjs(me.expiredAt).diff(kdayjs(), 'day')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          사용자 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">아이디</span>
            <span className="text-sm font-semibold">{me.accountId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">이름</span>
            <span className="text-sm font-semibold">{me.name || '-'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">권한</span>
            <Badge variant={me.role === 'ADMIN' ? 'default' : 'secondary'}>{me.role}</Badge>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              만료일
            </span>
            <div className="text-right">
              <div className={`text-sm font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {kdayjs(me.expiredAt).format('YYYY-MM-DD')}
              </div>
              {!isExpired && (
                <div className="text-muted-foreground text-xs">
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry}일 남음` : '오늘 만료'}
                </div>
              )}
              {isExpired && <div className="text-xs text-red-500">만료됨</div>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              <Search className="h-4 w-4" />
              남은 검색 횟수
            </span>
            <div className="text-right">
              <div className="text-sm font-semibold">{me.remainingProductCount.toLocaleString()}</div>
              <div className="text-muted-foreground text-xs">/ {me.maxProductCount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
