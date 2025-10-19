'use client'

import { useEffect } from 'react'
import { EditProduct } from '../serverAction'
import dynamic from 'next/dynamic'
import { Button } from '@repo/ui/components/button'
const TinyEditor = dynamic(() => import('@/components/TinyEditor'), { ssr: false })

export default function ProductDetailEditor({
  form,
  handleChange,
  handleToDetailImageEditor,
}: {
  form: EditProduct
  handleChange: ({ name, value }: { name: string; value: any }) => void
  handleToDetailImageEditor: () => void
}) {
  const { selectedTaobaoProduct } = form
  const { detail } = selectedTaobaoProduct.myData as any
  function handleResetDetail() {
    const confirmed = confirm('상세페이지를 초기화하시겠습니까? \n 번역을 포함한 모든 작업내용이 초기화됩니다.')
    if (confirmed) {
      const originalData = (selectedTaobaoProduct.originalData as any).detail
      handleChange({ name: 'selectedTaobaoProduct.myData.detail', value: originalData })
    }
  }

  return (
    <div className="flex h-full max-h-full w-full flex-1 flex-col gap-4">
      <div className="h-fit w-full">
        <Button variant="outline" onClick={handleToDetailImageEditor}>
          상세 이미지 편집
        </Button>
        <Button variant="outline" onClick={handleResetDetail}>
          상세페이지 초기화
        </Button>
      </div>
      <div className="h-full max-h-full flex-1" id="product-detail-editor-wrapper">
        <TinyEditor
          value={detail}
          onChange={html => {
            handleChange({ name: 'selectedTaobaoProduct.myData.detail', value: html })
          }}
          uiSelector="#product-detail-editor-wrapper"
        />
      </div>
    </div>
  )
}
