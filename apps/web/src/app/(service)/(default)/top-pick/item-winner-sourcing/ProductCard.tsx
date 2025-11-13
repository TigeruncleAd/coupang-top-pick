import { Button } from '@repo/ui/components/button'
import { Star, StarHalf, Plus, Check, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { wingProductItemsViaExtension } from '@/lib/utils/extension'
import type { WingProductSummary } from '@/types/wing'
import { forwardRef } from 'react'

interface ProductCardProps {
  product: WingProductSummary
  extensionId: string
  onSave?: (product: WingProductSummary) => void
  isSaving?: boolean
  isSaved?: boolean
  validationResult?: {
    hasOptionPicker: boolean
    optionCount: number
    optionOrder?: string[]
    attributeValues?: string[]
    rocketAttributeValues?: string[]
    firstAttributeValue?: string | null
    error?: string
  }
  onValidate?: () => void
  isValidating?: boolean
}

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

const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(function ProductCard(
  { product, extensionId, onSave, isSaving, isSaved, validationResult, onValidate, isValidating },
  ref,
) {
  const imgUrl = product.imagePath.startsWith('http')
    ? product.imagePath
    : `https://thumbnail6.coupangcdn.com/thumbnails/remote/260x260/image/${product.imagePath}`
  const productUrl = `https://www.coupang.com/vp/products/${product.productId}?itemId=${product.itemId}&vendorItemId=${product.vendorItemId}`

  // 검증 상태에 따른 스타일 결정 (dark 모드 기준)
  const getValidationStatus = () => {
    if (!validationResult) return null

    if (validationResult.error) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-400" />,
        text: '검증 실패',
        className: 'text-red-400 bg-red-950/30 border-red-800/50',
      }
    }

    if (validationResult.hasOptionPicker) {
      const optionOrderText =
        validationResult.optionOrder && validationResult.optionOrder.length > 0
          ? ` (${validationResult.optionOrder.join(', ')})`
          : ''
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
        text: `검증 완료 - 드롭다운 옵션 존재`,
        className: 'text-green-400 bg-green-950/30 border-green-800/50',
      }
    } else {
      return {
        icon: <XCircle className="h-4 w-4 text-orange-400" />,
        text: '검증 실패',
        className: 'text-orange-400 bg-orange-950/30 border-orange-800/50',
      }
    }
  }

  const validationStatus = getValidationStatus()

  console.log('[ProductCard] 🔍 Product ID:', product.productId)
  console.log('[ProductCard] 🔍 validationResult:', validationResult)
  console.log('[ProductCard] 🔍 validationResult?.firstAttributeValue:', validationResult?.firstAttributeValue)
  console.log('[ProductCard] 🔍 validationStatus:', validationStatus)

  return (
    <div
      ref={ref}
      className={`border-border bg-card flex gap-4 rounded-lg border p-4 shadow-sm ${validationStatus ? validationStatus.className : ''}`}>
      <img src={imgUrl} alt={product.productName} className="h-32 w-32 flex-shrink-0 rounded object-cover" />
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-foreground font-semibold">{product.productName}</h3>
        <p className="text-muted-foreground text-sm">상품ID: {product.productId}</p>
        {product.itemName && <p className="text-sm text-blue-400">위너 아이템명: {product.itemName}</p>}
        {product.itemId && <p className="text-sm text-blue-400">위너 아이템ID: {product.itemId}</p>}
        {product.brandName && <p className="text-muted-foreground text-sm">브랜드명: {product.brandName}</p>}
        {product.manufacture && <p className="text-muted-foreground text-sm">제조사: {product.manufacture}</p>}
        {product.displayCategoryInfo?.[0] && (
          <p className="text-muted-foreground text-sm">카테고리: {product.displayCategoryInfo[0].categoryHierarchy}</p>
        )}
        <div className="mt-1">{renderStars(product.rating, product.ratingCount)}</div>
        <p className="text-muted-foreground text-sm">
          경쟁상품수: {product.itemCountOfProduct?.toLocaleString() ?? '-'}
        </p>
        <p className="text-muted-foreground text-sm">
          조회수(최근 28일): {product.pvLast28Day?.toLocaleString() ?? '-'}
        </p>
        <p className="text-muted-foreground text-sm">
          판매량(최근 28일): {product.salesLast28d?.toLocaleString() ?? '-'}
        </p>
        <p className="text-muted-foreground text-sm">배송정보: 국내배송</p>

        {/* 검증 상태 표시 */}
        {validationStatus && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              {validationStatus.icon}
              <span className="text-sm font-medium">{validationStatus.text}</span>
            </div>
            {/* 에러 메시지 표시 */}
            {validationResult?.error && (
              <div className="ml-6 rounded-md bg-red-500/20 px-2 py-1">
                <span className="text-xs font-medium text-red-400">{validationResult.error}</span>
              </div>
            )}
            {validationResult?.optionOrder && validationResult.optionOrder.length > 0 && (
              <div className="ml-6 flex flex-wrap gap-1">
                <span className="text-muted-foreground text-xs">옵션 순서:</span>
                {validationResult.optionOrder.map((option, index) => (
                  <span key={index} className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                    {option}
                  </span>
                ))}
              </div>
            )}
            {validationResult?.rocketAttributeValues &&
              validationResult.rocketAttributeValues.length > 0 &&
              validationResult.optionOrder &&
              validationResult.optionOrder.length > 0 && (
                <div className="ml-6 mt-1">
                  <span className="text-muted-foreground text-xs font-medium">
                    로켓 {validationResult.optionOrder[0]} :{' '}
                  </span>
                  <span className="text-xs text-orange-400">
                    {validationResult.rocketAttributeValues.join(', ')}
                  </span>
                </div>
              )}
            {validationResult?.firstAttributeValue && (
              <div className="ml-6 mt-1">
                <span className="text-muted-foreground text-xs font-medium">첫 번째 속성 값: </span>
                <span className="text-xs text-blue-400">{validationResult.firstAttributeValue}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {onValidate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onValidate}
            disabled={isValidating || isSaving}>
            {isValidating ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                검증 중...
              </>
            ) : (
              '상품검증'
            )}
          </Button>
        )}
        {onSave && (
          <Button
            size="sm"
            variant={isSaved ? 'outline' : 'default'}
            onClick={() => onSave(product)}
            disabled={isSaving || isSaved || !validationResult?.hasOptionPicker}
            className={isSaved ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100' : ''}>
            {isSaved ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                저장완료
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                저장하기
              </>
            )}
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <a href={productUrl} target="_blank" rel="noopener noreferrer">
            상품 보기
          </a>
        </Button>
        {/* <Button
          size="sm"
          onClick={async () => {
            const uploadUrl = 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2'
            window.open(uploadUrl, '_blank', 'noopener,noreferrer')
            await new Promise(r => setTimeout(r, 1500))
            await wingProductItemsViaExtension({
              extensionId,
              productId: product.productId,
              itemId: product.itemId,
              categoryId: product.categoryId,
              targetTabUrl: uploadUrl,
              productName: product.productName,
              vendorItemId: product.vendorItemId,
            })
          }}>
          업로드하기
        </Button> */}
      </div>
    </div>
  )
})

export default ProductCard
