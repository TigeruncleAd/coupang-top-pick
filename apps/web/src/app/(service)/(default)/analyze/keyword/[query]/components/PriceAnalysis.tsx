'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react'

interface PriceAnalysisProps {
  average10Price: number
  average40Price: number
  average80Price: number
  product10Prices: { price: number; purchaseCount: number }
  product40Prices: { price: number; purchaseCount: number }
  product80Prices: { price: number; purchaseCount: number }
}

export default function PriceAnalysis({
  average10Price,
  average40Price,
  average80Price,
  product10Prices,
  product40Prices,
  product80Prices
}: PriceAnalysisProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  const formatCount = (count: number) => {
    return new Intl.NumberFormat('ko-KR').format(count) + '개'
  }

  const priceData = [
    {
      title: '상위 10개 상품',
      average: average10Price,
      total: product10Prices.price,
      count: product10Prices.purchaseCount,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500'
    },
    {
      title: '상위 40개 상품',
      average: average40Price,
      total: product40Prices.price,
      count: product40Prices.purchaseCount,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500'
    },
    {
      title: '상위 80개 상품',
      average: average80Price,
      total: product80Prices.price,
      count: product80Prices.purchaseCount,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500'
    }
  ]

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          가격 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {priceData.map((data, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${data.bgColor} ${data.borderColor}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">{data.title}</h3>
                <Badge variant="outline" className={data.color}>
                  평균
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">평균 가격</span>
                  <span className={`font-bold ${data.color}`}>
                    {formatPrice(data.average)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">총 거래액</span>
                  <span className="text-white font-medium">
                    {formatPrice(data.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">구매 건수</span>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {formatCount(data.count)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 가격 트렌드 차트 영역 */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-medium">가격 분포</h3>
          </div>
          
          <div className="space-y-2">
            {priceData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-400">{data.title}</div>
                <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${data.color.replace('text-', 'bg-')} transition-all duration-500`}
                    style={{ 
                      width: `${(data.average / Math.max(average10Price, average40Price, average80Price)) * 100}%` 
                    }}
                  />
                </div>
                <div className="w-24 text-right text-sm text-white">
                  {formatPrice(data.average)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
