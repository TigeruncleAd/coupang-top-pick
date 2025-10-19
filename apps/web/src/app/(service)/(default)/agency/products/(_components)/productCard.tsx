'use client'

import { getRecommendedPrice } from '@/lib/utils/getRecommendedPrice'
import { nameShuffler } from '@/lib/utils/nameShuffler'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Trash2, Save, Link, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { IoMdRefresh } from 'react-icons/io'
import { Label } from '@repo/ui/components/label'
import { Badge } from '@repo/ui/components/badge'
import { Checkbox } from '@repo/ui/components/checkbox'
import { EditProductListProduct } from '../serverAction'
const isDev = process.env.NODE_ENV === 'development'

export default function ProductCard({
  product,
  handleChange,
  executeDelete,
  isDeleting,
  handleSaveOne,
  isSaving,
  isSelected,
  handleSelect,
  handleOpenEditModal,
  cnyCurrency,
}: {
  product: EditProductListProduct
  handleChange: ({ productId, name, value }) => void
  executeDelete: ({ productId }: { productId: bigint }) => void
  isDeleting: boolean
  handleSaveOne: ({ productId }: { productId: bigint }) => void
  isSaving: boolean
  isSelected: boolean
  handleSelect: (productId: bigint) => void
  handleOpenEditModal: (productId: bigint) => void
  cnyCurrency: number
}) {
  const { selectedTaobaoProduct, category } = product
  const myData = selectedTaobaoProduct.myData as any

  const options = (product.options as any) || []
  const titleByte = product.myName?.length * 2

  const competitivePrice = product.discountedPrice || product.originalPrice || 0
  const minPrice = Math.min(...options, competitivePrice) || 0
  const maxPrice = Math.max(...options, competitivePrice) || 0

  const selectedTaobaoOptions = (selectedTaobaoProduct?.options as any) || []
  const minSelectedTaobaoPrice =
    (Math.min(...selectedTaobaoOptions, product.selectedTaobaoProduct?.price * 100) || 0) / 100
  const maxSelectedTaobaoPrice =
    (Math.max(...selectedTaobaoOptions, product.selectedTaobaoProduct?.price * 100) || 0) / 100

  const recommendedPriceMin = getRecommendedPrice({
    originalPrice: minSelectedTaobaoPrice,
    cnyCurrency,
    deliveryAgencyFee: product.deliveryAgencyFee,
  })
  const recommendedPriceMax = getRecommendedPrice({
    originalPrice: maxSelectedTaobaoPrice,
    cnyCurrency,
    deliveryAgencyFee: product.deliveryAgencyFee,
  })
  const recommendStatus = recommendedPriceMin < minPrice + competitivePrice ? 'recommended' : 'not_recommended'

  return (
    <Card key={product.id} className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">
            <div
              className="text-primary hover:text-primary/80 flex items-center gap-2 transition-colors"
              onClick={() => handleSelect(product.id)}>
              <Checkbox checked={isSelected} onCheckedChange={() => {}} />
              {product.name}
            </div>
          </CardTitle>
          <div className="flex shrink-0 gap-2">
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
            <Button
              variant="default"
              size="sm"
              disabled={isSaving}
              onClick={async () => {
                await handleSaveOne({ productId: product.id })
              }}>
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid-cols-[220px_1fr] gap-4 lg:grid">
          <div className="flex h-full w-full flex-col items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="border-border h-52 w-52 rounded-md border object-cover"
              loading={'lazy'}
            />
            <div className="mt-4 w-full">
              <div className="mb-2 shrink-0 font-medium">매칭된 타오바오 상품</div>
              {selectedTaobaoProduct ? (
                <div className="flex justify-start">
                  <div className="flex flex-col items-center justify-center">
                    <a
                      href={selectedTaobaoProduct?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2">
                      <img
                        src={selectedTaobaoProduct?.image}
                        alt={'taobao'}
                        className="h-24 w-24 rounded-md object-cover"
                        loading={'lazy'}
                      />
                    </a>
                    <div className="text-sm font-semibold">¥{selectedTaobaoProduct?.price}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm">매칭된 타오바오 상품이 없습니다.</div>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 overflow-x-auto text-[15px]">
            <div className="w-full">
              <div className="mb-2 flex items-center gap-2">
                <Label className="font-medium">원본 상품명 : {myData?.koName}</Label>
                {/* <Badge variant={titleByte > 80 ? 'destructive' : 'secondary'} className="text-xs">
                  {titleByte} Byte ({titleByte} / 80)
                </Badge> */}
                {/* <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleChange({
                      productId: product.id,
                      name: 'myData.koName',
                      value: product.orginalData.koName,
                    })
                  }>
                  <IoMdRefresh className="h-4 w-4" />
                </Button> */}
              </div>
              <div className="flex w-full gap-2">
                {/* <div>{myData?.koName}</div> */}
                {/* <Input
                  type="text"
                  value={product.myName}
                  maxLength={40}
                  onChange={e => {
                    const value = e.target.value?.slice(0, 40)
                    handleChange({
                      productId: product.id,
                      name: 'myName',
                      value: value,
                    })
                  }}
                  className="flex-1"
                /> */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newName = nameShuffler(product.myName)
                    handleChange({
                      productId: product.id,
                      name: 'myName',
                      value: newName,
                    })
                  }}>
                  뒤 3단어 섞기
                </Button> */}
              </div>
            </div>
            <ProductInfoText
              label={'카테고리'}
              value={
                ((category as any)?.map(category => category.label).join(' > ') || '') +
                ` (${category?.[(category as any).length - 1]?.id || ''})`
              }
            />
            <div className="flex w-full flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                경쟁 판매가 (원): {(competitivePrice + minPrice).toLocaleString('ko-KR')} ~{' '}
                {(competitivePrice + maxPrice).toLocaleString('ko-KR')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                경쟁 배송료 (원): {(product.deliveryFee || 0).toLocaleString('ko-KR')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                타오바오 가격(￥): {minSelectedTaobaoPrice} ~ {maxSelectedTaobaoPrice}
              </Badge>
              <Badge
                variant="outline"
                className={`text-sm ${recommendStatus === 'recommended' ? 'text-green-500' : 'text-red-500'}`}>
                추천 판매가 (원): {recommendedPriceMin?.toLocaleString('ko-KR')} ~{' '}
                {recommendedPriceMax?.toLocaleString('ko-KR')}
              </Badge>
            </div>

            <div className="mt-4 w-full">
              <div className="mb-2 shrink-0 font-medium">상품 메모</div>
              <textarea
                value={product.memo}
                onChange={e =>
                  handleChange({
                    productId: product.id,
                    name: 'memo',
                    value: e.target.value,
                  })
                }
                rows={3}
                placeholder={'메모를 입력하세요. (최대 500자)'}
                maxLength={500}
                className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm"
              />
              <div className="flex w-full justify-end">
                <div className="text-xs text-gray-400">{product.memo?.length || 0} / 500</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(product.id)}>
              상품 상세 수정
            </Button>
          </div>
        </div>
        {isDev && (
          <div className="mt-12">
            개발 디버깅
            <div>
              <a href={product.url || ''} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400">
                {product.url || ''}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductInfoText({ label, value }) {
  return (
    <Badge variant="outline" className="text-sm">
      {label}: {value}
    </Badge>
  )
}
