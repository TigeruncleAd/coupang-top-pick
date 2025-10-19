'use client'

import { Button } from '@repo/ui/components/button'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogOverlay } from '@repo/ui/components/dialog'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { EditProduct, getProductDetail, saveProduct } from '../serverAction'
import { LoadingCircle } from '@repo/ui/common/LoadingCircle'
import { useServerAction } from '@repo/utils'
import { toast } from 'sonner'
import _ from 'lodash'
import ProductDefaultEditor from './productDefaultEditor'
import ProductThumbnailEditor from './productThumbnailEditor'
import ProductDetailEditor from './productDetailEditor'
import ProductOptionEditor from './productOptionEditor'
import ProductDetailImageEditor from './productDetailImageEditor'

export const EDITOR_TYPE = {
  DEFAULT: {
    label: '기본정보',
    value: 'default',
  },
  OPTION: {
    label: '옵션',
    value: 'option',
  },
  THUMBNAIL: {
    label: '썸네일',
    value: 'thumbnail',
  },
  DETAIL: {
    label: '상세',
    value: 'detail',
  },
  DETAIL_IMAGE: {
    label: '상세 이미지',
    value: 'detail_image',
  },
}

export default function ProductEditor({
  productId,
  isOpen,
  onClose,
  onSave,
  cnyCurrency,
}: {
  productId: bigint
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  cnyCurrency: number
}) {
  const [form, setForm] = useState<EditProduct | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [editorType, setEditorType] = useState(EDITOR_TYPE.DEFAULT.value)
  const { data: product, isLoading } = useQuery({
    queryKey: ['productEditor', productId?.toString()],
    queryFn: async () => {
      const product = await getProductDetail({ productId })
      setForm(product)
      return product
    },
    enabled: !!productId && isOpen,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const { execute: executeSave, isLoading: isSaving } = useServerAction(saveProduct, {
    onSuccess: ({ message }) => {
      toast.success(message ?? '저장에 성공했습니다.')
      setIsDirty(false)
      onSave()
    },
    onError: ({ message }) => {
      toast.error(message ?? '저장에 실패했습니다.')
    },
  })

  function handleClose() {
    if (isDirty) {
      const result = confirm('저장하지 않고 닫으시겠습니까? 모든 수정사항은 사라집니다.')
      if (result) {
        setIsDirty(false)
        setForm(null)
        setEditorType(EDITOR_TYPE.DEFAULT.value)
        onClose()
      }
    } else {
      setIsDirty(false)
      setForm(null)
      setEditorType(EDITOR_TYPE.DEFAULT.value)
      onClose()
    }
  }

  function handleSave(form: EditProduct) {
    executeSave({ form })
  }

  function handleChange({ name, value }: { name: string; value: any }) {
    const newForm = _.cloneDeep(form)
    setIsDirty(true)
    _.set(newForm, name, value)
    setForm(newForm)
    return newForm
  }

  function renderEditor() {
    switch (editorType) {
      case EDITOR_TYPE.DEFAULT.value:
        return <ProductDefaultEditor form={form} handleChange={handleChange} cnyCurrency={cnyCurrency} />
      case EDITOR_TYPE.THUMBNAIL.value:
        return <ProductThumbnailEditor form={form} handleChange={handleChange} handleSave={handleSave} />
      case EDITOR_TYPE.DETAIL.value:
        return (
          <ProductDetailEditor
            form={form}
            handleChange={handleChange}
            handleToDetailImageEditor={() => setEditorType(EDITOR_TYPE.DETAIL_IMAGE.value)}
          />
        )
      case EDITOR_TYPE.DETAIL_IMAGE.value:
        return <ProductDetailImageEditor form={form} handleChange={handleChange} handleSave={handleSave} />
      case EDITOR_TYPE.OPTION.value:
        return <ProductOptionEditor form={form} handleChange={handleChange} cnyCurrency={cnyCurrency} />
      default:
        return <ProductDefaultEditor form={form} handleChange={handleChange} cnyCurrency={cnyCurrency} />
    }
  }

  //save on ctrl + s
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = e => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave(form)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [form, isOpen])

  return (
    <Dialog open={isOpen} modal={false}>
      {/* editor가 모달과 호환이 안좋아서 자체 오버레이 */}
      {isOpen && (
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/60" />
      )}
      <DialogContent
        id="product-editor-dialog-content"
        defaultCloseButton={false}
        className="flex h-[95vh] max-h-[95vh] flex-col overflow-y-hidden sm:max-w-7xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <DialogTitle>상품 상세 수정</DialogTitle>
            {Object.values(EDITOR_TYPE).map(type => {
              const isActive = editorType === type.value
              return (
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => setEditorType(type.value)}
                  key={type.value}>
                  {type.label}
                </Button>
              )
            })}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => handleClose()}>
              닫기
            </Button>
            <Button variant="default" onClick={() => handleSave(form)}>
              저장 (ctrl + s)
            </Button>
          </div>
        </DialogHeader>
        {isLoading && <LoadingCircle />}
        {!isLoading && form && <div className="max-h-full flex-1 overflow-y-auto">{renderEditor()}</div>}
      </DialogContent>
    </Dialog>
  )
}
