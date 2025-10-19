'use client'
import { kdayjs } from '@repo/utils'
import { Category, MarketSetting, Product, User } from '@repo/database'
import dynamic from 'next/dynamic'

const ProductView = dynamic(() => import('./view'), { ssr: false })

export default function UploadProductViewBridge({
  listData,
  date,
  user,
  marketSetting,
  categories,
  patch,
}: {
  listData: Product[]
  date: string
  user: User
  marketSetting: MarketSetting
  categories: Category[]
  patch: { url: string; date: string; version: string; detail: string }
}) {
  return (
    <ProductView
      listData={listData}
      dateString={date ?? kdayjs().format('YYYY-MM-DD')}
      user={user}
      marketSetting={marketSetting}
      categories={categories as Category[]}
      patch={patch}
    />
  )
}
