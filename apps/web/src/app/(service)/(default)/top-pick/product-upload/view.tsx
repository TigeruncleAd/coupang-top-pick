'use client'
import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/components/button'
import { wingProductItemsViaExtension } from '@/lib/utils/extension'
import { Star, StarHalf, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserProducts, deleteProduct, updateProductStatus } from '@/serverActions/product/product.action'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog'
import type { Product } from '@repo/database'

export default function Client({ extensionId }: { extensionId: string }) {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // 사용자 상품 목록 조회 (페이지네이션)
  const { data: userProductsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['userProducts', currentPage],
    queryFn: async () => {
      const result = await getUserProducts(currentPage, 20)
      return result
    },
  })

  const userProducts = userProductsData?.products ?? []
  const totalCount = userProductsData?.totalCount ?? 0
  const totalPages = userProductsData?.totalPages ?? 1

  // 상품 상태 업데이트 mutation
  const updateProductStatusMutation = useMutation({
    mutationFn: ({ productId, status }: { productId: bigint; status: 'READY' | 'UPLOADED_RAW' }) =>
      updateProductStatus(productId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProducts'] })
      toast.success('상품이 업로드되었습니다.')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상태 업데이트에 실패했습니다.')
    },
  })

  // 상품 삭제 mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: bigint) => deleteProduct(productId),
    onSuccess: () => {
      // 현재 페이지의 상품이 1개만 남아있고, 1페이지가 아니라면 이전 페이지로 이동
      if (userProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
      queryClient.invalidateQueries({ queryKey: ['userProducts'] })
      toast.success('상품이 삭제되었습니다.')
      setProductToDelete(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 삭제에 실패했습니다.')
      setProductToDelete(null)
    },
  })

  // 삭제 확인 후 실행
  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.productId)
    }
  }

  // 확장프로그램 메시지 리스너 (상품 업로드 완료 알림)
  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('[product-upload/view] 🎯 Message listener setup started')

    const handleMessage = (event: MessageEvent) => {
      console.log('[product-upload/view] 📨 window.message received')
      console.log('[product-upload/view] Event origin:', event.origin)
      console.log('[product-upload/view] Event data:', event.data)
      console.log('[product-upload/view] Event source:', event.data?.source)

      // 확장프로그램에서 온 메시지만 처리
      if (event.data?.source !== 'coupang-extension') {
        console.log('[product-upload/view] ⚠️ Message ignored - not from coupang-extension')
        return
      }

      console.log('[product-upload/view] ✅ Message from coupang-extension confirmed')
      console.log('[product-upload/view] Message type:', event.data.type)

      if (event.data.type === 'UPDATE_PRODUCT_STATUS' && event.data.productId) {
        console.log('[product-upload/view] 🎯 UPDATE_PRODUCT_STATUS message received!')
        console.log('[product-upload/view] ProductId:', event.data.productId)
        console.log('[product-upload/view] 📤 Triggering mutation...')

        // 상태 업데이트
        updateProductStatusMutation.mutate({
          productId: BigInt(event.data.productId),
          status: 'UPLOADED_RAW',
        })

        console.log('[product-upload/view] ✅ Mutation triggered')
      } else {
        console.log('[product-upload/view] ⚠️ Message type or productId missing')
      }
    }

    window.addEventListener('message', handleMessage)
    console.log('[product-upload/view] ✅ Message listener registered')

    return () => {
      console.log('[product-upload/view] 🧹 Cleaning up message listener')
      window.removeEventListener('message', handleMessage)
    }
  }, [updateProductStatusMutation])

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
      <div className="mx-auto w-full max-w-6xl">
        {/* 내 상품 목록 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              저장된 상품 (총 {totalCount}개 / 현재 페이지: {currentPage}/{totalPages})
            </h2>
          </div>
          {isLoadingProducts ? (
            <p className="text-muted-foreground text-sm">로딩 중...</p>
          ) : userProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">저장된 상품이 없습니다.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {userProducts.map(product => {
                  const imgUrl = product.imagePath.startsWith('http')
                    ? product.imagePath
                    : `https://thumbnail6.coupangcdn.com/thumbnails/remote/260x260/image/${product.imagePath}`
                  const productUrl = `https://www.coupang.com/vp/products/${product.productId}?itemId=${product.itemId}&vendorItemId=${product.vendorItemId}`
                  const displayCategoryInfo = product.displayCategoryInfo as any[]
                  return (
                    <div
                      key={product.id.toString()}
                      className="border-border bg-card flex gap-4 rounded-lg border p-4 shadow-sm">
                      <img
                        src={imgUrl}
                        alt={product.productName}
                        className="h-32 w-32 flex-shrink-0 rounded object-cover"
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <h3 className="text-foreground line-clamp-2 font-semibold">{product.productName}</h3>
                        <p className="text-muted-foreground text-sm">가격: {product.salePrice.toLocaleString()}원</p>
                        {displayCategoryInfo?.[0] && (
                          <p className="text-muted-foreground/70 text-xs">{displayCategoryInfo[0].categoryHierarchy}</p>
                        )}
                        <div className="mt-1">{renderStars(product.rating, product.ratingCount)}</div>
                        <p className="text-muted-foreground text-xs">
                          경쟁상품: {product.itemCountOfProduct.toLocaleString()}개
                        </p>
                        <p className="text-muted-foreground text-xs">
                          최근 28일: 조회 {product.pvLast28Day.toLocaleString()} / 판매{' '}
                          {product.salesLast28d.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={productUrl} target="_blank" rel="noopener noreferrer">
                            상품 보기
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            const uploadUrl = 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2'
                            window.open(uploadUrl, '_blank', 'noopener,noreferrer')
                            await new Promise(r => setTimeout(r, 1500))
                            await wingProductItemsViaExtension({
                              extensionId,
                              productId: Number(product.productId),
                              itemId: Number(product.itemId),
                              categoryId: product.categoryId,
                              targetTabUrl: uploadUrl,
                              productName: product.productName,
                              vendorItemId: Number(product.vendorItemId),
                            })
                          }}>
                          업로드하기
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setProductToDelete(product)}
                          disabled={deleteProductMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}>
                    이전
                  </Button>
                  <div className="flex gap-1">
                    {/* 첫 페이지 */}
                    {currentPage > 3 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} className="min-w-[40px]">
                          1
                        </Button>
                        {currentPage > 4 && <span className="flex items-center px-2">...</span>}
                      </>
                    )}

                    {/* 현재 페이지 주변 */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                      .map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]">
                          {page}
                        </Button>
                      ))}

                    {/* 마지막 페이지 */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="flex items-center px-2">...</span>}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="min-w-[40px]">
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}>
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={!!productToDelete} onOpenChange={open => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>상품을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 선택한 상품이 영구적으로 삭제됩니다.
              </AlertDialogDescription>
              {productToDelete && (
                <div className="bg-muted mt-3 rounded-md p-3">
                  <p className="text-foreground text-sm font-medium">{productToDelete.productName}</p>
                  <p className="text-muted-foreground mt-1 text-xs">상품ID: {productToDelete.productId.toString()}</p>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteProductMutation.isPending}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteProductMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleteProductMutation.isPending ? '삭제 중...' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
