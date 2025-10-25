'use client'
import { useState, useTransition } from 'react'
import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import { wingSearchViaExtension, openOffscreenWindowExt, pushToExtension } from '@/lib/utils/extension'
import type { WingSearchHttpEnvelope, WingProductSummary } from '@/types/wing'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '@/serverActions/product/product.action'
import { toast } from 'sonner'
import ProductCard from './ProductCard'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui/components/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'

const MIN_ITEM_COUNT_OF_PRODUCT = 3

export default function Client({ extensionId }: { extensionId: string }) {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<WingSearchHttpEnvelope | null>(null)
  const [error, setError] = useState<string>('')
  const [isJsonOpen, setIsJsonOpen] = useState(false)
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set())

  // 상품 생성 mutation
  const createProductMutation = useMutation({
    mutationFn: (product: WingProductSummary) => createProduct(product),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['userProducts'] })
      // 저장된 상품 Set에 추가 (productId)
      setSavedProducts(prev => new Set(prev).add(product.productId.toString()))
      toast.success('상품이 저장되었습니다.')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 저장에 실패했습니다.')
    },
  })

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

      // 필터링된 결과만 저장
      const filteredResults =
        envelope.data?.result
          ?.filter(p => p.deliveryMethod === 'DOMESTIC' && (p.itemCountOfProduct ?? 0) >= MIN_ITEM_COUNT_OF_PRODUCT)
          .slice(0, 20) ?? []

      setResult({
        ...envelope,
        keyword,
        data: {
          ...envelope.data,
          result: filteredResults,
        },
      })

      // 검색 완료 후 WING 검색 탭 닫기
      await new Promise(r => setTimeout(r, 1000))
      await pushToExtension({
        extensionId,
        payload: { type: 'CLOSE_SEARCH_TAB' },
      })
    })
  }

  const filtered = result?.data?.result ?? []

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* 검색 폼 */}
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

        {result && (
          <Collapsible open={isJsonOpen} onOpenChange={setIsJsonOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border p-4">
              {isJsonOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <h2 className="text-lg font-semibold">크롤링 데이터 (Raw JSON)</h2>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="max-h-96 overflow-auto rounded-lg border p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 검색 결과 */}
        {filtered.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold">검색 결과 (상위 {filtered.length}개)</h2>
              <p className="mt-1 text-sm text-gray-500">
                국내배송, 경쟁상품 {MIN_ITEM_COUNT_OF_PRODUCT}개 이상, 최대 20개까지 표시
              </p>
            </div>
            <div className="space-y-4">
              {filtered.map(product => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  extensionId={extensionId}
                  onSave={product => createProductMutation.mutate(product)}
                  isSaving={createProductMutation.isPending}
                  isSaved={savedProducts.has(product.productId.toString())}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
