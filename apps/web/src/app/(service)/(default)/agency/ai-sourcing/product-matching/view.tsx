'use client'

import {
  deleteProduct,
  fetchMatchTaobao,
  makeTaobaoImageSearchQueue,
  matchTaobaoProduct,
  matchTaobaoProductMany,
} from './serverAction'
import { kdayjs, useServerAction } from '@repo/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { LoadingCircle } from '@repo/ui'
import { LICENSE_TYPE, Product, TaobaoProduct, User } from '@repo/database'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog'
import { PopcornIcon, AlertCircleIcon, Download, Trash2, Link, ChevronLeft, ChevronRight } from 'lucide-react'
import { Checkbox } from '@repo/ui/components/checkbox'
import { useQuery } from '@tanstack/react-query'
import { useMe } from '@/hooks/useMe'
import AgencyDateSelector from '@/components/AgencyDateSelector'
import { useAgencyDate } from '@/hooks/useAgencyDate'

type data = Product & {
  taobaoProducts: TaobaoProduct[]
  selectedTaobaoProduct?: {
    url: string
    taobaoId: string
  } | null
}
const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST

export default function ProductView({
  patch,
}: {
  patch: { url: string; date: string; version: string; detail: string } | null
}) {
  const router = useRouter()
  //엑셀 출력 등 상품 갯수가 많아야 몇백개라 client에서 페이지네이션.
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(50)
  const [dateString, setDateString, query, setQuery] = useAgencyDate()
  const [isRefetching, setIsRefetching] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<bigint[]>([])
  const intervalRef = useRef<NodeJS.Timeout[]>([])
  const { me: user, isLoading: isLoadingUser, refetchMe } = useMe()

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['match-taobao-image', dateString, query],
    queryFn: () => fetchMatchTaobao({ date: dateString, query }),
    enabled: !!dateString,
  })
  const listData = data?.listData ?? []

  const totalCount = listData.length
  const totalPages = Math.ceil(totalCount / size)
  const currentListData = listData.slice((page - 1) * size, page * size)
  const { remainingProductCount, maxProductCount } = user ?? {}
  const crawlCount = selectedProductIds.length
  const failedCount = listData.filter(product => product.status === 'FAILED').length

  const { execute: executeMatchTaobaoProductMany, isLoading: isMatchingMany } = useServerAction(
    matchTaobaoProductMany,
    {
      onSuccess: () => {
        refetch()
      },
      onError: ({ message }) => {
        toast.error(message ?? '에러가 발생했습니다.')
      },
    },
  )

  const { execute: executeMakeQueue, isLoading: isMakingQueue } = useServerAction(makeTaobaoImageSearchQueue, {
    onSuccess: () => {
      setIsConfirmOpen(false)
      setIsRefetching(true)
      refetch()
      refetchMe()
      setSelectedProductIds([])
    },
    onError: ({ message }) => {
      setIsConfirmOpen(false)
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  const { execute: matchTaobao, isLoading: isMatching } = useServerAction(matchTaobaoProduct, {
    onSuccess: () => {
      refetch()
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  const { execute: executeDelete, isLoading: isDeleting } = useServerAction(deleteProduct, {
    onSuccess: ({ message }) => {
      refetch()
      toast.success(message)
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  function handleConfirm() {
    executeMakeQueue({ date: dateString, selectedProductIds: selectedProductIds, isAll: false })
  }

  function handleSelectProduct(productId: bigint) {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      }
      return [...prev, productId]
    })
  }

  function handleSelectAllProducts() {
    if (selectedProductIds.length === listData.length) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(listData.map(product => product.id))
    }
  }

  function handleSelectPendingProducts() {
    setSelectedProductIds(
      listData
        .filter(product => product.taobaoProducts.length === 0 && product.status !== 'CRAWLING')
        .map(product => product.id),
    )
  }

  function handleSelectMatchedProducts() {
    setSelectedProductIds(
      listData.filter(product => product.selectedTaobaoProduct?.status === 'PENDING').map(product => product.id),
    )
  }

  useEffect(() => {
    if (
      listData.some(product => product.status === 'CRAWLING') ||
      listData.some(product => product.taobaoProducts.some(taobaoProduct => taobaoProduct.status === 'CRAWLING'))
    ) {
      setIsRefetching(true)
    } else {
      setIsRefetching(false)
    }
  }, [listData])

  useEffect(() => {
    //scroll to top
    window?.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    setPage(1)
  }, [dateString])

  useEffect(() => {
    let interval
    if (isRefetching) {
      interval = setInterval(() => {
        refetch()
        console.log('refresh')
      }, 5000)
      intervalRef.current.push(interval)
    } else {
      clearInterval(interval)
      intervalRef.current.forEach(clearInterval)
      intervalRef.current = []
    }

    return () => {
      clearInterval(interval)
      intervalRef.current.forEach(clearInterval)
      intervalRef.current = []
    }
  }, [isRefetching])
  if (isLoadingUser || isLoading) return <LoadingCircle />

  return (
    <div className="relative min-h-screen w-full space-y-4 p-4">
      {/* 패치 섹션 */}
      {patch && user.license === LICENSE_TYPE.A && (
        <Alert>
          {/* <AlertCircleIcon /> */}
          <PopcornIcon />
          <AlertTitle>새 패치 버전 {patch.version}</AlertTitle>
          <AlertDescription className="mt-3">
            <div className="text-muted-foreground mb-1 text-sm">릴리스 날짜: {patch.date}</div>
            {patch.detail && <div className="mb-3 text-sm">{patch.detail}</div>}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900">
              <a href={patch.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                패치 다운로드
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 날짜 필터링 및 버튼 */}
      <Card className="sticky top-0 z-10 py-4">
        <CardContent>
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <AgencyDateSelector useSearch />
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleSelectAllProducts}>
                  전체 선택
                </Button>
                <Button variant="outline" onClick={handleSelectPendingProducts}>
                  대기중 선택
                </Button>
                <Button variant="outline" onClick={handleSelectMatchedProducts}>
                  매칭완료 선택
                </Button>
                <div className="text-sm text-gray-300">{selectedProductIds.length}개 선택</div>
              </div>
            </div>
            <div className="flex w-full items-center gap-4">
              <Button
                variant="default"
                disabled={isMakingQueue}
                onClick={() => {
                  if (selectedProductIds.length <= 0) toast.error('수집할 상품을 선택 해 주세요.')
                  else if (selectedProductIds.length > remainingProductCount)
                    toast.error(
                      `수집할 상품 갯수 ${selectedProductIds.length}개가 금일 잔여 검색 ${remainingProductCount}개를 초과했습니다.\n상품을 제거하여 검색 갯수를 줄여주세요.`,
                    )
                  else setIsConfirmOpen(true)
                }}>
                이미지 검색 시작
              </Button>
              <Button
                variant="default"
                className="bg-titan-red hover:bg-titan-red/90 text-white"
                disabled={isMakingQueue}
                onClick={() => {
                  const notMatchedProducts = listData.filter(
                    product => product.taobaoProducts.length > 0 && !product.selectedTaobaoProductId,
                  )
                  if (notMatchedProducts.length <= 0) toast.error('매칭할 상품이 없습니다.')
                  else
                    executeMatchTaobaoProductMany({
                      products: notMatchedProducts.map(product => ({
                        productId: product.id,
                        taobaoProductId: product.taobaoProducts[0]?.id as any,
                      })),
                    })
                }}>
                일괄 매칭
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 수집된 상품 리스트 */}
      <div className="w-full space-y-4 pb-24">
        {currentListData.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground">수집된 상품이 없습니다.</div>
            </CardContent>
          </Card>
        )}
        {currentListData.map((product, idx) => {
          // const product = listData[idx]
          const { taobaoProducts } = product
          const { category } = product as any
          const isCrawling = product.status === 'CRAWLING'
          const isCrawlingDetail = taobaoProducts.some(taobaoProduct => taobaoProduct.status === 'CRAWLING')

          return (
            <Card key={product.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg">
                    {/* <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-2 transition-colors">
                      <Link className="h-4 w-4" />({product.productId}) {product.name}
                    </a> */}
                    <div
                      className="text-primary hover:text-primary/80 flex items-center gap-2 transition-colors"
                      onClick={() => handleSelectProduct(product.id)}>
                      <Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={() => {}} />
                      {product.name}
                    </div>
                  </CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={async () => {
                      await executeDelete({ productId: product.id })
                    }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full grid-cols-[220px_1fr] items-start gap-4 sm:grid">
                  <div className="flex h-full w-full items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="border-border h-52 w-52 rounded-md border object-cover"
                      loading={'lazy'}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-3 overflow-hidden">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-sm">
                        판매가: {product.discountedPrice}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        정상가: {product.originalPrice}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        배송료: {product.deliveryFee}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      <span className="font-medium">카테고리:</span>{' '}
                      {(category?.map(category => category.label).join(' > ') || '') +
                        ` (${category?.[category.length - 1]?.id || ''})`}
                    </div>
                    <div className="w-full">
                      <div className="mb-3 text-lg font-medium">타오바오 상품 검색 결과</div>
                      {isCrawling && (
                        <div className="flex items-center justify-center py-8">
                          <LoadingCircle />
                        </div>
                      )}

                      <div className="flex w-full gap-4 overflow-x-auto px-1 py-2">
                        {taobaoProducts.map(taobaoProduct => {
                          const isMatched = taobaoProduct?.id === product?.selectedTaobaoProductId
                          const isThisCrawlingDetail = taobaoProduct.status === 'CRAWLING'
                          const isCrawlFailed = taobaoProduct.status === 'FAILED'
                          return (
                            <Card
                              key={taobaoProduct.id.toString()}
                              className={`shrink-0 ${isMatched ? 'ring-primary ring-2' : ''}`}>
                              <CardContent className="p-3">
                                <div className="flex flex-col items-center justify-center">
                                  <a
                                    href={taobaoProduct.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2">
                                    {/* <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                      {taobaoProduct.matchedCount}번 매칭됨
                                    </div> */}
                                    <img
                                      src={taobaoProduct.image}
                                      alt={taobaoProduct.name}
                                      className="border-border h-24 w-24 rounded-md border object-cover"
                                      loading={'lazy'}
                                    />
                                    <Badge variant="secondary" className="text-xs">
                                      ¥{taobaoProduct.price}
                                    </Badge>
                                  </a>
                                  <Button
                                    size="sm"
                                    variant={isMatched ? 'default' : 'outline'}
                                    // disabled={isMatching || isMatchingMany || isCrawlingDetail || isCrawling}
                                    className="mt-2 w-full"
                                    onClick={async () =>
                                      await matchTaobao({
                                        productId: product.id,
                                        taobaoProductId: taobaoProduct.id,
                                      })
                                    }>
                                    {isThisCrawlingDetail
                                      ? '수집중'
                                      : isCrawlFailed
                                        ? '수집 실패'
                                        : isMatched
                                          ? '매칭됨'
                                          : '매칭'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                        {product?.status === 'PENDING' && (
                          <Card className="shrink-0">
                            <CardContent className="flex items-center justify-center p-6">
                              <div className="text-muted-foreground">상품 검색 대기중</div>
                            </CardContent>
                          </Card>
                        )}
                        {product?.status === 'FAILED' && (
                          <Card className="shrink-0">
                            <CardContent className="flex items-center justify-center p-6">
                              <div className="text-destructive">상품 검색 실패</div>
                            </CardContent>
                          </Card>
                        )}
                        {product?.status === 'CRAWLED' && taobaoProducts.length === 0 && (
                          <Card className="shrink-0">
                            <CardContent className="flex items-center justify-center p-6">
                              <div className="text-muted-foreground">검색 결과 없음</div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 페이지네이션 */}
      <Card className="fixed bottom-0 left-0 w-full">
        <CardContent>
          <div className="flex items-center justify-center gap-3">
            {totalPages > 0 && (
              <Select
                value={size.toString()}
                onValueChange={value => {
                  setSize(Number(value))
                }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1)
              }}>
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                return (
                  <Button
                    key={idx}
                    variant={page === idx + 1 ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setPage(idx + 1)
                    }}>
                    {idx + 1}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => {
                setPage(page + 1)
              }}>
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Badge variant="secondary" className="ml-2">
              총 {totalCount}건
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 실행 중 모달 */}
      {(isMatching || isDeleting || isMatchingMany) && <ExecutingModal />}

      {/* 확인 모달 */}
      {isConfirmOpen && (
        <ConfirmModal
          execute={handleConfirm}
          onClose={() => setIsConfirmOpen(false)}
          message={
            <div className="space-y-4">
              <div className="text-foreground text-center text-lg font-medium">
                타오바오 이미지 검색을 시작하시겠습니까?
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-muted-foreground mb-2 text-center text-sm">
                  일일 검색 가능 갯수 {maxProductCount}개 중 잔여 {remainingProductCount}개가 남아있습니다.
                </div>
                <div className="flex justify-center gap-2">
                  <Badge variant="secondary">검색 대기중: {crawlCount}개</Badge>
                  <Badge variant="destructive">검색 실패: {failedCount}개</Badge>
                </div>
              </div>

              <div className="text-muted-foreground space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                  검색 갯수를 줄이려면 상품을 삭제하거나 검색 대기중인 상품을 확인해주세요.
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                  검색 시작 후에는 중단이 불가능하며, 잔여 검색 갯수{' '}
                  <Badge variant="outline" className="mx-1">
                    {crawlCount}개
                  </Badge>
                  가 차감됩니다.
                </div>
              </div>
            </div>
          }
        />
      )}
    </div>
  )
}

function ExecutingModal() {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>처리중입니다</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-6">
          <LoadingCircle />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmModal({ execute, onClose, message }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>확인</DialogTitle>
        </DialogHeader>
        <div className="py-4">{message}</div>
        <div className="flex justify-center gap-4">
          <Button onClick={execute}>확인</Button>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
