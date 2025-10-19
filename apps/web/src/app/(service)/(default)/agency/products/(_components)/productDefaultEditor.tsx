'use client'

import { Input } from '@repo/ui/components/input'
import { EditProduct } from '../serverAction'
import { defaultWeightPrices } from '../const'
import { nameShuffler } from '@/lib/utils/nameShuffler'
import { Button } from '@repo/ui/components/button'
import { IoMdRefresh } from 'react-icons/io'
import { Label } from '@repo/ui/components/label'
import { Badge } from '@repo/ui/components/badge'
import { getRecommendedPrice } from '@/lib/utils/getRecommendedPrice'

export default function ProductDefaultEditor({
  form,
  handleChange,
  cnyCurrency,
}: {
  form: EditProduct
  cnyCurrency: number
  handleChange: ({ name, value }: { name: string; value: any }) => void
}) {
  const titleByte = form.myName?.length * 2
  const { selectedTaobaoProduct, category } = form
  const myData = selectedTaobaoProduct.myData as any

  const options = ((form.options as any) || []).map(o => o.price)

  const competitivePrice = form.discountedPrice || form.originalPrice || 0
  const minPrice = Math.min(...options, competitivePrice) || 0
  const maxPrice = Math.max(...options, competitivePrice) || 0

  const selectedTaobaoOptions = ((selectedTaobaoProduct?.options as any) || []).map(o => o.price)
  const minSelectedTaobaoPrice =
    (Math.min(...selectedTaobaoOptions, form.selectedTaobaoProduct?.price * 100) || 0) / 100
  const maxSelectedTaobaoPrice =
    (Math.max(...selectedTaobaoOptions, form.selectedTaobaoProduct?.price * 100) || 0) / 100

  const recommendedPriceMin = getRecommendedPrice({
    originalPrice: minSelectedTaobaoPrice,
    cnyCurrency,
    deliveryAgencyFee: form.deliveryAgencyFee,
  })
  const recommendedPriceMax = getRecommendedPrice({
    originalPrice: maxSelectedTaobaoPrice,
    cnyCurrency,
    deliveryAgencyFee: form.deliveryAgencyFee,
  })
  const recommendStatus = recommendedPriceMin < minPrice + competitivePrice ? 'recommended' : 'not_recommended'

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <Label className="font-medium">원본 상품명 : {myData?.koName}</Label>
        <div className="my-2 flex items-center gap-2">
          <Label className="font-medium">내 상품명</Label>
          <Badge variant={titleByte > 80 ? 'destructive' : 'secondary'} className="text-xs">
            {titleByte} Byte ({titleByte} / 80)
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              handleChange({
                name: 'myName',
                value: form.name,
              })
            }>
            <IoMdRefresh className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex w-full gap-2">
          <Input
            type="text"
            value={form.myName}
            maxLength={40}
            onChange={e => {
              const value = e.target.value?.slice(0, 40)
              handleChange({
                name: 'myName',
                value: value,
              })
            }}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newName = nameShuffler(form.myName)
              handleChange({
                name: 'myName',
                value: newName,
              })
            }}>
            뒤 3단어 섞기
          </Button>
        </div>
      </div>
      <div>
        <div className="mb-2 shrink-0 font-medium">배대지 비용</div>
        <div className="flex w-full gap-1">
          {defaultWeightPrices.map((weightPrice, idx) => {
            return (
              <div
                key={idx}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border p-2 ${
                  weightPrice.price === form.deliveryAgencyFee ? 'bg-blue-100' : ''
                } `}
                onClick={() => {
                  handleChange({
                    name: 'deliveryAgencyFee',
                    value: weightPrice.price,
                  })
                }}>
                <div className="shrink-0 font-medium">{weightPrice.weight}kg</div>
                <div className="">{weightPrice.price}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex w-full flex-wrap gap-2">
        <Badge variant="secondary" className="text-sm">
          경쟁 판매가 (원): {(competitivePrice + minPrice).toLocaleString('ko-KR')} ~{' '}
          {(competitivePrice + maxPrice).toLocaleString('ko-KR')}
        </Badge>
        <Badge variant="outline" className="text-sm">
          경쟁 배송료 (원): {(form.deliveryFee || 0).toLocaleString('ko-KR')}
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
      <div className="flex items-center gap-4">
        <div className=" ">
          <div className="mb-2 shrink-0 font-medium">내 정상가 (원)</div>
          <Input
            type={'number'}
            value={form.myPrice}
            onChange={e =>
              handleChange({
                name: 'myPrice',
                value: Number(e.target.value),
              })
            }
          />
        </div>
        <div className=" ">
          <div className="mb-2 shrink-0 font-medium">내 할인가 (원)</div>
          <Input
            type={'number'}
            value={form.myDiscountedPrice}
            onChange={e =>
              handleChange({
                name: 'myDiscountedPrice',
                value: Number(e.target.value),
              })
            }
          />
        </div>
        <div className="">
          <div className="mb-2 shrink-0 font-medium">내 배송료</div>
          <Input
            type={'number'}
            value={form.myDeliveryFee}
            onChange={e =>
              handleChange({
                name: 'myDeliveryFee',
                value: Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
