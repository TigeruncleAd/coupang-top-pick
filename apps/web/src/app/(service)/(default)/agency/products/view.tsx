'use client'

import { deleteProduct, getProductDetailList, saveProducts } from './serverAction'
import { kdayjs, useServerAction } from '@repo/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import _ from 'lodash'
import { LoadingCircle } from '@repo/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogTitle, DialogHeader, DialogContent } from '@repo/ui/components/dialog'
import { useQuery } from '@tanstack/react-query'
import { useAgencyDate } from '@/hooks/useAgencyDate'
import AgencyDateSelector from '@/components/AgencyDateSelector'
import ProductCard from './(_components)/productCard'
import { Badge } from '@repo/ui/components/badge'
import dynamic from 'next/dynamic'
import { useCNYCurrency } from '@/hooks/useCNYCurrency'
const ProductEditor = dynamic(() => import('./(_components)/productEditor'), { ssr: false })

export default function ProductView() {
  const router = useRouter()
  const [listDataState, setListDataState] = useState([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(50)
  const [allMargin, setAllMargin] = useState(0)
  const [allDeliveryFee, setAllDeliveryFee] = useState(0)
  const [dateString, setDateString, query, setQuery] = useAgencyDate()
  const [selectedProductIds, setSelectedProductIds] = useState<bigint[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<bigint | null>(null)
  const { cnyCurrency, isCNYCurrencyLoading } = useCNYCurrency()
  console.log(dateString, query)

  const { execute: executeSave, isLoading: isSaving } = useServerAction(saveProducts, {
    onSuccess: ({ message }) => {
      router.refresh()
      toast.success(message)
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  const { execute: executeDelete, isLoading: isDeleting } = useServerAction(deleteProduct, {
    onSuccess: ({ message, id }) => {
      // router.refresh()
      const newListData = _.cloneDeep(listDataState)
      const targetIndex = newListData.findIndex(product => product.id === id)
      newListData.splice(targetIndex, 1)
      setListDataState(newListData)
      toast.success(message)
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  const {
    data,
    refetch,
    isLoading: isLoadingList,
  } = useQuery({
    queryKey: ['product-detail-list', dateString, page, size, query],
    queryFn: async () => {
      const { listData, totalCount } = await getProductDetailList({ dateString, page, size, query })
      setListDataState(listData)
      return { listData, totalCount }
    },
    enabled: !!dateString,
    staleTime: 0,
  })

  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / size)
  const currentListData = listDataState
  const isLoading = isLoadingList || isCNYCurrencyLoading

  useEffect(() => {
    //scroll to top
    window?.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    setPage(1)
  }, [dateString])

  function handleChange({ productId, name, value }) {
    const newListData = _.cloneDeep(listDataState)
    const targetProduct = newListData.find(product => product.id === productId)
    _.set(targetProduct, name, value)
    _.set(targetProduct, 'isEdited', true)
    setListDataState(newListData)
  }

  async function handleSaveOne({ productId }) {
    const targetProduct = listDataState.find(product => product.id === productId)
    await executeSave({ products: [targetProduct] })
  }

  async function handleSaveAll() {
    const targetProducts = listDataState.filter(product => (product as any).isEdited)
    await executeSave({ products: targetProducts })
  }

  function handleSelect(productId: bigint) {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(prev => prev.filter(id => id !== productId))
    } else {
      setSelectedProductIds(prev => [...prev, productId])
    }
  }

  function handleOpenEditModal(productId: bigint) {
    setEditProductId(productId)
    setIsEditModalOpen(true)
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false)
    setEditProductId(null)
    refetch()
  }

  return (
    <>
      <ProductEditor
        productId={editProductId}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={() => {}}
        cnyCurrency={cnyCurrency}
      />
      <div className="relative min-h-screen p-4">
        {/* 상품관리 상단 날짜 및 버튼 */}
        <Card className="sticky top-0 z-10">
          <CardContent>
            <div className="flex w-full items-center justify-between">
              <AgencyDateSelector useSearch />
              <div className="flex items-center gap-4">
                <Button
                  variant="default"
                  className="bg-titan-red hover:bg-titan-red/90 text-white"
                  onClick={async () => {
                    await handleSaveAll()
                  }}>
                  일괄 저장
                </Button>
                <Input
                  value={allMargin}
                  className="w-24"
                  onChange={e => {
                    setAllMargin(Number(e.target.value))
                  }}
                  type="number"
                  placeholder="마진"
                />
                <Button
                  variant="default"
                  onClick={() => {
                    const newListData = _.cloneDeep(listDataState)
                    newListData.forEach(product => {
                      product.myMargin = allMargin
                      product.isEdited = true
                    })
                    setListDataState(newListData)
                  }}>
                  일괄 마진 적용
                </Button>

                <Input
                  value={allDeliveryFee}
                  className="w-24"
                  onChange={e => {
                    setAllDeliveryFee(Number(e.target.value))
                  }}
                  type="number"
                  placeholder="배송료"
                />
                <Button
                  variant="default"
                  onClick={() => {
                    const newListData = _.cloneDeep(listDataState)
                    newListData.forEach(product => {
                      product.myDeliveryFee = allDeliveryFee
                      product.isEdited = true
                    })
                    setListDataState(newListData)
                  }}>
                  일괄 배송료 적용
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 수집된 상품 */}
        <div className="mt-4 space-y-4 pb-24">
          {isLoading && <LoadingCircle />}
          {currentListData.map((product, idx) => {
            return (
              <ProductCard
                key={product.id.toString()}
                product={product}
                handleChange={handleChange}
                executeDelete={executeDelete}
                isDeleting={isDeleting}
                handleSaveOne={handleSaveOne}
                isSaving={isSaving}
                isSelected={selectedProductIds.includes(product.id)}
                handleSelect={handleSelect}
                handleOpenEditModal={handleOpenEditModal}
                cnyCurrency={cnyCurrency}
              />
            )
          })}
          {!isLoading && currentListData.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-muted-foreground mb-2 text-lg font-medium">수집된 상품이 없습니다.</div>
                <div className="text-muted-foreground text-sm">
                  쇼핑몰 매칭에서 상품을 수집 후 타오바오 매칭을 진행해 주세요.
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 페이지네이션  */}
        <Card className="fixed bottom-0 left-0 w-full">
          <CardContent>
            <div className="flex items-center justify-center gap-3">
              {/* {totalPages > 0 && (
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
            )} */}

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
        {(isSaving || isDeleting) && <ExecutingModal />}
      </div>
    </>
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
