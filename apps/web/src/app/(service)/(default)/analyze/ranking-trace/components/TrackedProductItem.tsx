'use client'

import { Button } from '@repo/ui/components/button'
import { ExternalLink, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// 마켓 타입
type MarketType = 'naver' | 'coupang'

// 추적 상품 인터페이스
interface TrackedProduct {
  id: string
  userTrackedProductId?: string
  name: string
  url: string
  market: MarketType
  currentRank?: number
  previousRank?: number
  rankChange?: number
  addedAt: string
  lastChecked?: string
}

interface TrackedProductItemProps {
  product: TrackedProduct
  onDelete: (id: string) => void
}

// 마켓 아이콘
const MarketIcon = ({ market }: { market: MarketType }) => {
  if (market === 'naver') {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded bg-green-600 text-xs font-bold text-white">
        N
      </div>
    )
  }
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">C</div>
  )
}

// 랭킹 변화 표시 컴포넌트
const RankChangeIndicator = ({ change }: { change?: number }) => {
  if (!change) return <span className="text-gray-400">-</span>

  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-green-400">
        <span className="text-xs">↗</span>+{change}
      </span>
    )
  } else if (change < 0) {
    return (
      <span className="flex items-center gap-1 text-red-400">
        <span className="text-xs">↘</span>
        {change}
      </span>
    )
  }

  return <span className="text-gray-400">-</span>
}

export default function TrackedProductItem({ product, onDelete }: TrackedProductItemProps) {
  const router = useRouter()

  const handleClick = () => {
    // 샘플 데이터가 아닌 경우에만 상세 페이지로 이동 (기본적으로 업데이트)
    if (!product.id.startsWith('sample-')) {
      router.push(`/analyze/ranking-trace/detail?productId=${product.id}`)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // 클릭 이벤트 전파 방지
    onDelete(product.id)
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation() // 클릭 이벤트 전파 방지
    window.open(product.url, '_blank')
  }

  return (
    <div
      className={`flex items-center justify-between rounded-lg bg-gray-700 p-4 transition-colors ${
        product.id.startsWith('sample-') ? 'cursor-default' : 'cursor-pointer hover:bg-gray-600'
      }`}
      onClick={handleClick}>
      <div className="flex items-center gap-3">
        <MarketIcon market={product.market} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{product.name}</span>
            {product.id.startsWith('sample-') && (
              <span className="rounded bg-blue-600 px-2 py-1 text-xs text-white">예시</span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            추가일: {product.addedAt} | 마지막 확인: {product.lastChecked || '미확인'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* 현재 랭킹 */}
        <div className="text-center">
          <div className="text-xs text-gray-400">현재 랭킹</div>
          <div className="text-lg font-bold text-white">{product.currentRank ? `${product.currentRank}위` : '-'}</div>
        </div>
        {/* 랭킹 변화 */}
        <div className="text-center">
          <div className="text-xs text-gray-400">변화</div>
          <RankChangeIndicator change={product.rankChange} />
        </div>
        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleExternalLink} className="text-blue-400 hover:text-blue-300">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
