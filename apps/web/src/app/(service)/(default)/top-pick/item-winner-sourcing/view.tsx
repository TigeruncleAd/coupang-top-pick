'use client'
import { useState, useTransition } from 'react'
import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import { wingSearchViaExtension, openOffscreenWindowExt } from '@/lib/utils/extension'
import type { WingSearchHttpEnvelope, WingProductSummary } from '@/types/wing'
import { Star, StarHalf } from 'lucide-react'

export default function Client({ extensionId }: { extensionId: string }) {
  const [keyword, setKeyword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<WingSearchHttpEnvelope | null>(null)
  const [error, setError] = useState<string>('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      // 1) WING 페이지를 오프스크린으로 먼저 열어 콘텐츠 스크립트 준비
      await openOffscreenWindowExt({
        extensionId,
        targetUrl: 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2',
      })
      // 2) 소폭 대기 후 WING_SEARCH 호출 (백그라운드에서 PING 핸드셰이크 있음)
      await new Promise(r => setTimeout(r, 500))
      const res = await wingSearchViaExtension({ extensionId, keyword })
      console.log('🔍 res', res)
      if (res?.status !== 'success') {
        setError('요청 실패')
        setResult(null)
        return
      }
      const envelope = res.data as WingSearchHttpEnvelope
      if (!envelope?.ok) {
        setError('검색 실패')
        setResult(null)
        return
      }
      setResult(envelope)
    })
  }

  const filtered = result?.data?.result?.filter(p => (p.itemCountOfProduct ?? 0) >= 10).slice(0, 30) ?? []

  function renderStars(rating: number | null | undefined, ratingCount: number | null | undefined) {
    if (!rating) return null
    const full = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
        {ratingCount != null && (
          <span className="text-muted-foreground ml-1 text-sm">({ratingCount.toLocaleString()}개 상품평)</span>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-4xl">
        <form className="flex w-full items-center gap-3" onSubmit={onSubmit}>
          <Input
            placeholder="키워드를 입력하세요"
            className="flex-1"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Button type="submit" className="shrink-0" disabled={isPending || !keyword.trim()}>
            {isPending ? '검색 중...' : '검색'}
          </Button>
        </form>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

        {filtered.length > 0 && (
          <div className="mt-8 space-y-4">
            {filtered.map(product => {
              const imgUrl = product.imagePath.startsWith('http')
                ? product.imagePath
                : `https://thumbnail6.coupangcdn.com/thumbnails/remote/260x260/image/${product.imagePath}`
              const productUrl = `https://www.coupang.com/vp/products/${product.productId}?itemId=${product.itemId}&vendorItemId=${product.vendorItemId}`
              return (
                <div key={product.productId} className="flex gap-4 rounded-lg border p-4">
                  <img
                    src={imgUrl}
                    alt={product.productName}
                    className="h-32 w-32 flex-shrink-0 rounded object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="font-semibold">{product.productName}</h3>
                    <p className="text-muted-foreground text-sm">쿠팡상품ID: {product.productId}</p>
                    {product.brandName && <p className="text-sm">브랜드명: {product.brandName}</p>}
                    {product.manufacture && <p className="text-sm">제조사: {product.manufacture}</p>}
                    {product.displayCategoryInfo?.[0] && (
                      <p className="text-sm">카테고리: {product.displayCategoryInfo[0].categoryHierarchy}</p>
                    )}
                    <div className="mt-1">{renderStars(product.rating, product.ratingCount)}</div>
                    <p className="text-sm">경쟁상품수: {product.itemCountOfProduct?.toLocaleString() ?? '-'}</p>
                    <p className="text-sm">조회수(최근 28일): {product.pvLast28Day?.toLocaleString() ?? '-'}</p>
                    <p className="text-sm">판매량(최근 28일): {product.salesLast28d?.toLocaleString() ?? '-'}</p>
                    <p className="text-sm">배송정보: {product.deliveryMethod ?? '-'}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={productUrl} target="_blank" rel="noopener noreferrer">
                        상품 보기
                      </a>
                    </Button>
                    <Button size="sm" disabled>
                      업로드하기
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
