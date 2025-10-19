'use client'
import { Product, Category } from '@repo/database'
import { useState } from 'react'
import { IoIosLink, IoIosWarning, IoMdRefresh } from 'react-icons/io'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import InfoIcon from '../../(_components)/InfoIcon'
import { nameShuffler } from '../../../../../../lib/utils/nameShuffler'
import clsx from 'clsx'
import CategorySelector from './CategorySelector'
import OptionEditor from './OptionEditor'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { BiX } from 'react-icons/bi'
import TagEditor from './TagEditor'

const TinyEditor = dynamic(() => import('@/components/TinyEditor'), { ssr: false })

interface ProductType extends Product {
  thumbnails: string[]
  category: { label: string; id: string }[]
}

interface Props {
  product: ProductType
  handleChange: ({ productId, name, value }) => void
  categories: Category[]
  isSelected: boolean
  handleSelect: (productId: bigint) => void
}

export default function UploadProductProduct({ product, handleChange, categories, isSelected, handleSelect }: Props) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isOptionOpen, setIsOptionOpen] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>(product.thumbnails[0] || product.image || '')
  const { thumbnails } = product
  const titleByte = product.myName?.length * 2
  const detailAsDom = new DOMParser().parseFromString(product.detail, 'text/html')
  const isPhoneNumberIncluded = detailAsDom.body.textContent?.includes('010')
  const isPhoneNumberIncluded2 = detailAsDom.body.textContent?.includes('070')
  const isEmailIncluded = detailAsDom.body.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const isWarning = isPhoneNumberIncluded || isPhoneNumberIncluded2 || isEmailIncluded

  const firstImage = getFirstImage(product.detail)
  const lastImage = getLastImage(product.detail)

  return (
    <div
      className="w-full rounded-md border bg-white p-4 shadow-md"
      onClick={e => {
        if (e.target === e.currentTarget) {
          handleSelect(product.id)
        }
      }}>
      {/* product name */}
      <div className="flex items-center justify-between gap-4 text-lg font-semibold">
        <label
          htmlFor={`checkBox_${product.id.toString()}`}
          className={`flex items-center gap-2 ${isWarning ? 'text-red-500' : ''}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSelect(product.id)}
            className="mr-2"
            id={`checkBox_${product.id.toString()}`}
          />
          {product.name} {isWarning ? <IoIosWarning className="h-4 w-4 text-red-500" /> : null}
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex gap-2">
            <IoIosLink className="h-4 w-4 text-gray-700" />
          </a>
        </label>
        <div className="text-xs text-gray-400">{product.id.toString()}</div>
        {/* <button type={'button'} onClick={() => executeCreateProduct({ productId: product.id })}>
          상품 등록
        </button> */}
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
            <button
              type={'button'}
              onClick={() =>
                handleChange({
                  productId: product.id,
                  name: 'myName',
                  value: product.name,
                })
              }>
              <IoMdRefresh className="text-gray-400" />
            </button>
          </div>
          <div className="flex w-full gap-2">
            <Input
              type={'text'}
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
            />
            <button
              className="shrink-0 rounded-md bg-yellow-500 px-2 py-1 text-white"
              onClick={() => {
                const newName = nameShuffler(product.myName)
                handleChange({
                  productId: product.id,
                  name: 'myName',
                  value: newName,
                })
              }}>
              뒤 3단어 섞기
            </button>
          </div>
          <div className="mt-2 flex w-full gap-2">
            <CategorySelector
              categories={categories}
              currentCategoryId={product.smartStoreCategoryId}
              onSelectCategory={category => {
                handleChange({
                  productId: product.id,
                  name: 'smartStoreCategoryId',
                  value: category.smartStoreId,
                })
              }}
            />
            <TagEditor
              tags={product.tags}
              handleChange={tags => handleChange({ productId: product.id, name: 'tags', value: tags })}
            />
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
              <div className="flex items-center gap-2 font-semibold">
                내 가격 설정 <InfoIcon info={'배송비는 무료배송으로 설정됩니다.'} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div>가격 : </div>
                <div>
                  <Input
                    type={'number'}
                    value={product.myPrice || product.discountedPrice - 500}
                    onChange={e =>
                      handleChange({
                        productId: product.id,
                        name: 'myPrice',
                        value: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                {/* <div>배송비 :</div>
                <div>
                  <Input
                    type={'number'}
                    value={product.myDeliveryFee}
                    onChange={e =>
                      handleChange({ productId: product.id, name: 'myDeliveryFee', value: parseInt(e.target.value) })
                    }
                  />
                </div> */}
              </div>
            </div>
          </div>
          <div className="rounded-md border p-2">
            <div
              className="flex w-full cursor-pointer items-center gap-2"
              onClick={() => setIsOptionOpen(!isOptionOpen)}>
              <div className="font-semibold">옵션 정보</div>
              <button
                type={'button'}
                onClick={() => setIsOptionOpen(!isOptionOpen)}
                className="rounded-md px-2 py-1 text-sm">
                <ChevronDownIcon className={`h-4 w-4 ${isOptionOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {isOptionOpen && (
              <div className="mt-2">
                <OptionEditor
                  options={product.options as any}
                  handleChange={option => handleChange({ productId: product.id, name: 'options', value: option })}
                  optionGroup1={product.optionGroup1}
                  optionGroup2={product.optionGroup2}
                  optionGroup3={product.optionGroup3}
                />
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-4">
            {product.detail && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">첫 번째 이미지</div>
                    {firstImage && (
                      <div className="w-24 break-all text-xs text-gray-500">{decodeImageName(firstImage)}</div>
                    )}
                  </div>
                  {firstImage && (
                    <div className="group relative">
                      <a href={firstImage} target="_blank" rel="noopener noreferrer">
                        <img src={firstImage} alt="첫 번째 이미지" className="h-64 w-64 rounded-md object-cover" />
                      </a>
                      <button
                        onClick={() => {
                          const newDetail = removeImageFromDetail(product.detail, firstImage)
                          handleChange({
                            productId: product.id,
                            name: 'detail',
                            value: newDetail,
                          })
                        }}
                        className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <BiX className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">마지막 이미지</div>
                    {lastImage && (
                      <div className="w-24 break-all text-xs text-gray-500">{decodeImageName(lastImage)}</div>
                    )}
                  </div>
                  {lastImage && (
                    <div className="group relative">
                      <a href={lastImage} target="_blank" rel="noopener noreferrer">
                        <img src={lastImage} alt="마지막 이미지" className="h-64 w-64 rounded-md object-cover" />
                      </a>
                      <button
                        onClick={() => {
                          const newDetail = removeImageFromDetail(product.detail, lastImage)
                          handleChange({
                            productId: product.id,
                            name: 'detail',
                            value: newDetail,
                          })
                        }}
                        className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <BiX className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 w-full">
        {isDetailOpen && (
          <div className="mt-4">
            <TinyEditor
              value={product.detail || ''}
              onChange={html => {
                handleChange({
                  productId: product.id,
                  name: 'detail',
                  value: html,
                })
              }}
            />
          </div>
        )}
        <button
          type={'button'}
          onClick={() => setIsDetailOpen(!isDetailOpen)}
          className="w-full rounded-md bg-gray-100 px-2 py-1 text-sm">
          {isDetailOpen ? '상세 정보 닫기' : '상세 정보 보기'}
        </button>
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

function getFirstImage(html: string): string | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const firstImg = doc.querySelector('img')
  return firstImg?.src || null
}

function getLastImage(html: string): string | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img')
  const lastImg = images[images.length - 1]
  return lastImg?.src || null
}

function removeImageFromDetail(html: string, imgSrc: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img')

  images.forEach(img => {
    if (img.src === imgSrc) {
      img.remove()
    }
  })

  return doc.body.innerHTML
}

function decodeImageName(imageName: string): string {
  try {
    return decodeURIComponent(imageName.split('/').pop() || '')
  } catch (e) {
    return imageName.split('/').pop() || ''
  }
}
