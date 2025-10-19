'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

interface SalesInfoCardProps {
  top10Data?: {
    sales: number
    quantity: number
    averagePrice: number
  }
  top40Data?: {
    sales: number
    quantity: number
    averagePrice: number
  }
}

export default function SalesInfoCard({
  top10Data = {
    sales: 0,
    quantity: 0,
    averagePrice: 0,
  },
  top40Data = {
    sales: 0,
    quantity: 0,
    averagePrice: 0,
  },
}: SalesInfoCardProps) {
  const formatNumber = (num: number) => {
    if (num === 0) return '0'
    return num.toLocaleString()
  }

  const formatPrice = (price: number) => {
    if (price === 0) return '0'
    return price.toLocaleString()
  }

  const formatSalesAmount = (amount: number) => {
    if (amount === 0) return '0'
    const roundedAmount = Math.round(amount / 100000) * 10 // 10만원 단위로 반올림
    return roundedAmount.toLocaleString() + '만원'
  }

  const formatAveragePrice = (averagePrice: number) => {
    if (averagePrice === 0) return '0'
    const roundedPrice = Math.round(averagePrice / 100) * 100 // 백원 단위로 반올림
    return roundedPrice.toLocaleString() + '원'
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="text-white">매출 정보</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Top 10 */}
          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Top 10</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">6개월 매출</p>
                <p className="text-lg font-bold text-white">{formatSalesAmount(top10Data.sales)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">6개월 판매량</p>
                <p className="text-lg font-bold text-white">{formatNumber(top10Data.quantity)} 개</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">평균 가격</p>
                <p className="text-lg font-bold text-white">{formatAveragePrice(top10Data.averagePrice)}</p>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-600"></div>

          {/* Top 40 */}
          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Top 40</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">6개월 매출</p>
                <p className="text-lg font-bold text-white">{formatSalesAmount(top40Data.sales)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">6개월 판매량</p>
                <p className="text-lg font-bold text-white">{formatNumber(top40Data.quantity)} 개</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">평균 가격</p>
                <p className="text-lg font-bold text-white">{formatAveragePrice(top40Data.averagePrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
