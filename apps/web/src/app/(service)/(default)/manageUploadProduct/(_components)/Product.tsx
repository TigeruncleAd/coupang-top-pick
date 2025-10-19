'use client'
import { Product } from '@repo/database'
import { useState } from 'react'
import { IoIosLink, IoMdRefresh } from 'react-icons/io'
import { toast } from 'sonner'
import clsx from 'clsx'
import { MarketManage } from './MarketManage'

interface ProductType extends Product {
  thumbnails: string[]
  category: { label: string; id: string }[]
}

interface Props {
  product: ProductType
  // handleChange: ({ productId, name, value }) => void
  handleDelete: ({ productId, market }) => void
  // isSelected: boolean
  // handleSelect: (productId: bigint) => void
}

export default function ManageUploadProductProduct({ product, handleDelete }: Props) {
  // const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>(product.thumbnails[0] || product.image || '')

  const { thumbnails } = product
  const titleByte = product.myName?.length * 2

  return (
    <div className="w-full rounded-md border bg-white p-4 shadow-md">
      {/* product name */}
      <div className="flex items-center justify-between gap-4 text-lg font-semibold">
        <label htmlFor={`checkBox_${product.id.toString()}`} className="flex items-center gap-2">
          {/* <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSelect(product.id)}
            className="mr-2"
            id={`checkBox_${product.id.toString()}`}
          /> */}
          {product.name}
          <a href={product.url} target="_blank" rel="noreferrer" className="flex gap-2">
            <IoIosLink className="h-4 w-4 text-gray-700" />
          </a>
        </label>
      </div>
      {/* big thumbnail and thumbnail list */}
      <div className="mt-2 flex w-full gap-4">
        <div className="flex w-1/4 flex-col gap-4">
          <div className="w-full">
            <img
              src={selectedThumbnail}
              alt={product.name}
              className="aspect-square w-full rounded-md object-cover"
              loading="lazy"
            />
          </div>
          <div className="grid w-full grid-cols-6 gap-2">
            {thumbnails.map((thumbnail, idx) => (
              <img
                src={thumbnail}
                alt={product.name}
                className="aspect-square w-full rounded-md object-cover"
                onMouseEnter={() => setSelectedThumbnail(thumbnail)}
                onTouchMove={() => setSelectedThumbnail(thumbnail)}
                loading="lazy"
                key={idx}
              />
            ))}
          </div>
        </div>
        <div className="flex w-full flex-col gap-1 text-sm">
          {/* <InfoIcon info={'내 상품명은 최대 40자입니다.\n내 상품명은 최대 40자입니다.'} /> */}
          <div className="mb-1 flex shrink-0 items-center gap-2 font-medium">
            내 상품명
            <div className={`shrink-0 text-xs ${titleByte > 80 ? 'text-red-500' : 'text-gray-400'}`}>
              {titleByte} Byte ({titleByte} / 80)
            </div>
            <IoMdRefresh className="text-gray-400" />
          </div>
          <div className="flex w-full gap-2">
            <Input type={'text'} value={product.myName} maxLength={40} disabled={true} onChange={e => {}} />
          </div>
          <div className="mt-2 flex w-full gap-2">
            <div className="rounded-md border p-2">
              <div className="font-semibold">경쟁사 가격 정보</div>
              <div className="mt-1.5 flex gap-2">
                <div>
                  <b>가격</b> : <span className="line-through">{product.originalPrice}</span> →
                  <span className="font-bold">{product.discountedPrice}</span>
                </div>
                <div className="flex items-center">
                  배송비 : <span>{product.deliveryFee}</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="flex items-center gap-2 font-semibold">내 가격</div>
              <div className="mt-1 flex items-center gap-2">
                <div>가격 : </div>
                <div>
                  <Input
                    type={'number'}
                    disabled={true}
                    value={product.myPrice || product.discountedPrice - 500}
                    onChange={e => {}}
                  />
                </div>
              </div>
            </div>
          </div>
          <MarketManage product={product} handleDelete={market => handleDelete({ market, productId: product.id })} />
        </div>
      </div>
    </div>
  )
}

function Input({ value, onChange, className = '', ...props }) {
  return (
    <input
      value={value}
      onChange={onChange}
      className={clsx('w-full rounded-md border border-gray-300 px-2 py-1 text-sm', className)}
      {...props}
    />
  )
}
