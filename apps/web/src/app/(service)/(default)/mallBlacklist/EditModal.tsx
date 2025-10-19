'use client'

import { FormRender } from '@repo/ui'
import { useServerAction } from '@repo/utils'
import { useEffect, useState } from 'react'
import { upsertMallBlacklist } from './serverAction'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function EditModal({ item, onClose, isOpen }: { item: any; onClose: () => void; isOpen: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState(item || {})
  const { execute, isLoading } = useServerAction(upsertMallBlacklist, {
    onSuccess: ({ message }) => {
      setForm({})
      onClose()
      toast.success(message)
      router.refresh()
    },
    onError: ({ message }) => {
      toast.error(message)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    execute(form)
  }
  useEffect(() => {
    if (!isOpen) {
      setForm({})
    } else {
      setForm(item || {})
    }
  }, [isOpen, item])
  console.log(form)

  if (!isOpen) return null
  return (
    <div className="absolute left-0 top-0 z-40 h-full w-full bg-black/50">
      <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-4">
        <FormRender form={form} setForm={setForm} onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormRender.Text itemKey="mallId" label="쇼핑몰 아이디" placeholder="breathekiml" />
          <FormRender.Text itemKey="mallName" label="쇼핑몰 이름" placeholder="브리드킴엘" />
          <FormRender.Text itemKey="memo" label="비고" placeholder="블랙리스트 처리 이유" />
          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              className="w-full rounded-md bg-gray-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              onClick={onClose}
              disabled={isLoading}>
              취소
            </button>
            <button
              type="submit"
              className="w-full rounded-md bg-blue-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={isLoading}>
              저장
            </button>
          </div>
        </FormRender>
      </div>
    </div>
  )
}
