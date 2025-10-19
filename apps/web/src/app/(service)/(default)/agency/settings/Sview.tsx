'use client'

import { FormRender } from '@repo/ui'
import { imageResizer, uploadS3PreSigned, useServerAction } from '@repo/utils'
import { useEffect, useState } from 'react'
import { updateUser } from './serverAction'
import { toast } from 'sonner'
import { myForm } from './type'
import _ from 'lodash'
const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST

export default function SettingView({ me }: { me: myForm }) {
  const [form, setForm] = useState(me)
  const [error, setError] = useState<any>({})
  const [isTopImageModalOpen, setIsTopImageModalOpen] = useState(false)
  const [isBottomImageModalOpen, setIsBottomImageModalOpen] = useState(false)

  const { execute, isLoading } = useServerAction(updateUser, {
    onSuccess: ({ message }) => toast.success(message),
    onError: ({ message }) => toast.error(message),
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const errors = validateForm(form)
    if (errors) {
      setError(errors)
      return
    }

    execute(form)
  }

  function validateForm(form: myForm) {
    const errors = null
    const phone = _.get(form, 'marketSetting.smartStoreAsPhoneNumber', '')
    if (phone && !phone.match(/^0\d{1,2}-\d{3,4}-\d{4}$/)) {
      _.set(errors, 'marketSetting.smartStoreAsPhoneNumber', '000-0000-0000 형식으로 입력해주세요.')
    }

    return errors
  }

  return (
    <div>
      <div>
        <div className="w-full max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">설정</div>
          </div>
          {/* 현재 접속자의 정보 */}
          <div className="mt-4 text-sm font-medium text-gray-700">
            현재 접속자 : {me.name} ({me.accountId})
          </div>
          <div className="mt-4 text-base font-bold text-red-700">
            !! 각 마켓 api설정에서 허용 아이피를 13.209.160.216 로 설정해주세요 !!
          </div>
          <FormRender
            form={form}
            setForm={setForm}
            formErrors={error}
            className="mt-4 flex w-full flex-col gap-6"
            onSubmit={handleSubmit}>
            <div>
              <div className="text-base font-semibold text-gray-700">스마트 스토어</div>
              <div className="mt-2 flex flex-wrap gap-6 rounded-md border border-gray-300 px-4 py-2">
                <FormRender.Text itemKey="marketSetting.smartStoreKey" label="스마트스토어 API 키" />
                <FormRender.Text
                  itemKey="marketSetting.smartStoreSecret"
                  label="스마트스토어 API 시크릿"
                  type="password"
                />
                <FormRender.Text itemKey="marketSetting.smartStoreMarketId" label="스마트스토어 마켓 아이디" />
                <FormRender.Text itemKey="marketSetting.smartStoreMarketName" label="스마트스토어 마켓명" />
                <FormRender.Text itemKey="marketSetting.smartStoreAsPhoneNumber" label="스마트스토어 AS 전화번호" />
                <FormRender.Number
                  itemKey="marketSetting.smartStoreMargin"
                  label="스마트스토어 마진(%)"
                  min={-100}
                  max={100}
                  required
                />
                {/* <FormRender.Text itemKey="marketSetting.smartStoreOutboundPlaceId" label="스마트스토어 출고 장소" /> */}
              </div>
            </div>
            <div>
              <div className="text-base font-semibold text-gray-700">쿠팡</div>
              <div className="mt-2 flex gap-6 rounded-md border border-gray-300 px-4 py-2">
                <FormRender.Text itemKey="marketSetting.coupangKey" label="쿠팡 API 키" />
                <FormRender.Text itemKey="marketSetting.coupangSecret" label="쿠팡 API 시크릿" type="password" />
                <FormRender.Text itemKey="marketSetting.coupangVendorId" label="쿠팡 업체 아이디" />
                <FormRender.Text itemKey="marketSetting.coupangMarketId" label="쿠팡 마켓 아이디" />
                <FormRender.Text
                  itemKey="marketSetting.coupangMarketName"
                  label="쿠팡 마켓명"
                  info="상품정보 - 브랜드에 사용됩니다(ex. OOO협력사)"
                />
                <FormRender.Number
                  itemKey="marketSetting.coupangOutboundTimeDay"
                  label="출고 소요일"
                  min={0}
                  max={20}
                  required
                />
                <FormRender.Number
                  itemKey="marketSetting.coupangMargin"
                  label="쿠팡 마진(%)"
                  min={-100}
                  max={100}
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-base font-semibold text-gray-700">ESM</div>
              <div className="mt-2 flex gap-6 rounded-md border border-gray-300 px-4 py-2">
                <FormRender.Text itemKey="marketSetting.esmId" label="ESM 아이디" />
                <FormRender.Text itemKey="marketSetting.esmPassword" label="ESM 비밀번호" type="password" />
                {/* <FormRender.Text itemKey="marketSetting.esmKey" label="ESM API 키" /> */}
                {/* <FormRender.Text itemKey="marketSetting.esmSecret" label="ESM API 시크릿" type="password" /> */}
                <FormRender.Number itemKey="marketSetting.esmMargin" label="ESM 마진(%)" min={0} max={100} required />
              </div>
            </div>
            <div>
              <div className="text-base font-semibold text-gray-700">11번가</div>
              <div className="mt-2 flex gap-6 rounded-md border border-gray-300 px-4 py-2">
                <FormRender.Text itemKey="marketSetting.street11Key" label="11번가 API 키" />
                {/* <FormRender.Text itemKey="marketSetting.street11Secret" label="11번가 API 시크릿" type="password" /> */}
                <FormRender.Toggle
                  itemKey="marketSetting.street11IsGlobal"
                  label="11번가 글로벌셀러 여부"
                  defaultValue={false}
                />
                <FormRender.Number
                  itemKey="marketSetting.street11Margin"
                  label="11번가 마진(%)"
                  min={-100}
                  max={100}
                  required
                />
              </div>
            </div>
            {/* <div>
              <div className="text-base font-semibold text-gray-700">지옥션</div>
              <div className="mt-2 flex gap-6 rounded-md border border-gray-300 px-4 py-2">
                <FormRender.Text itemKey="marketSetting.gOctionKey" label="지옥션 API 키" />
                <FormRender.Text itemKey="marketSetting.gOctionSecret" label="지옥션 API 시크릿" type="password" />
              </div>
            </div> */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTopImageModalOpen(true)}
                className="w-48 rounded-md bg-blue-500 px-4 py-2 text-white">
                상단 이미지 설정
              </button>
              <button
                type="button"
                onClick={() => setIsBottomImageModalOpen(true)}
                className="w-48 rounded-md bg-blue-500 px-4 py-2 text-white">
                하단 이미지 설정
              </button>
            </div>
            <div className="flex w-full justify-center">
              <button className="w-24 rounded-md bg-blue-500 px-4 py-2 text-white">저장</button>
            </div>
          </FormRender>
        </div>
      </div>
      {isTopImageModalOpen && (
        <ImageModal
          images={form.marketSetting?.topImages ?? []}
          handleChange={images => {
            _.set(form, 'marketSetting.topImages', images)
          }}
          isOpen={isTopImageModalOpen}
          onClose={() => setIsTopImageModalOpen(false)}
        />
      )}
      {isBottomImageModalOpen && (
        <ImageModal
          images={form.marketSetting?.bottomImages ?? []}
          handleChange={images => {
            _.set(form, 'marketSetting.bottomImages', images)
          }}
          isOpen={isBottomImageModalOpen}
          onClose={() => setIsBottomImageModalOpen(false)}
        />
      )}
    </div>
  )
}

function ImageModal({
  images,
  isOpen,
  onClose,
  handleChange,
}: {
  images: string[]
  isOpen: boolean
  onClose: () => void
  handleChange: (images: string[]) => void
}) {
  const [localImages, setLocalImages] = useState<string[]>(images)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    fileArray.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        setLocalImages(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemove = (index: number) => {
    setLocalImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newImages = [...localImages]
    ;[newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]]
    setLocalImages(newImages)
  }

  const handleMoveDown = (index: number) => {
    if (index === localImages.length - 1) return
    const newImages = [...localImages]
    ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    setLocalImages(newImages)
  }

  const handleSave = async () => {
    try {
      const newImages = []
      for (const image of localImages) {
        if (image.includes('data:image')) {
          const base64Response = await fetch(image)
          const blob = await base64Response.blob()
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })

          const resizedFile = await imageResizer(file, {
            maxWidth: 3000,
            maxHeight: 3000,
            quality: 100,
            compressFormat: 'PNG',
          })

          const { public_url, s3Key } = await uploadS3PreSigned(resizedFile, ['marketSetting', 'topImages'])
          newImages.push(`${cdnHost}/${s3Key}`)
        } else {
          newImages.push(image)
        }
      }
      handleChange(newImages)
      toast.success('이미지 설정 완료\n반드시 하단의 설정 저장을 해주세요.')
      onClose()
    } catch (error) {
      console.error('이미지 처리 중 오류 발생:', error)
      toast.error('이미지 처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    setLocalImages(images)
  }, [isOpen])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex max-h-[90vh] w-[800px] flex-col rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">이미지 관리</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full rounded border p-2"
          />
        </div>
        <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
          {localImages.map((image, index) => (
            <div key={index} className="relative">
              <img src={image} alt={`image ${index + 1}`} className="w-full object-scale-down" />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 bg-black bg-opacity-50 p-2">
                <button
                  onClick={() => handleMoveUp(index)}
                  className="rounded bg-blue-500 px-2 py-1 text-white"
                  disabled={index === 0}>
                  ↑
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  className="rounded bg-blue-500 px-2 py-1 text-white"
                  disabled={index === localImages.length - 1}>
                  ↓
                </button>
                <button onClick={() => handleRemove(index)} className="rounded bg-red-500 px-2 py-1 text-white">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="rounded bg-gray-500 px-4 py-2 text-white">
            취소
          </button>
          <button
            onClick={async e => {
              await handleSave()
            }}
            className="rounded bg-blue-500 px-4 py-2 text-white">
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
