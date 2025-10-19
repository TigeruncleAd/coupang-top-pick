'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { baseUrl, title } from '../../consts'
import { upsertMutation } from '../../serverAction'
import { useServerAction } from '@repo/utils'
import { ActionButton, FormRender } from '@repo/ui'
import { toast } from 'sonner'
import { USER_STATUS } from '@repo/database'

export default function EditUserView({ id, item, profiles }) {
  const router = useRouter()
  const [form, setForm] = useState<any>(item || {})

  const { execute, isLoading } = useServerAction(upsertMutation, {
    onSuccess: data => {
      // router.back()
      router.refresh()
      toast.success(data?.message ?? '저장되었습니다.')
    },
    onError: error => {
      toast.error(error?.message ?? '저장에 실패했습니다.')
    },
  })
  function handleSubmit() {
    execute({ form })
  }

  if (id && !item) {
    return <div>*올바르지 않은 접근입니다.</div>
  }

  useEffect(() => {
    if (item) setForm(item)
  }, [item])

  return (
    <div className="relative pb-16">
      <div className="text-lg font-bold">{title}</div>
      <div className="mt-4 max-w-lg">
        <FormRender form={form} setForm={setForm} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormRender.Text itemKey={'accountId'} label={'아이디'} required placeholder={'아이디'} readOnly={!!item} />
          <FormRender.Text
            itemKey={'password'}
            label={'비밀번호'}
            required={!item}
            placeholder={'비밀번호'}
            type="password"
          />
          <hr />
          <FormRender.Text itemKey={'name'} label={'이름'} required placeholder={'홍길동'} />

          <div className="flex items-end gap-2">
            <FormRender.DateTime itemKey={'expiredAt'} label={'계정 만료일시'} required />
            <button
              type="button"
              onClick={() => {
                const currentExpiredAt = form.expiredAt ? new Date(form.expiredAt) : new Date()
                console.log(currentExpiredAt)
                currentExpiredAt.setDate(currentExpiredAt.getDate() + 3)
                setForm(prev => ({ ...prev, expiredAt: currentExpiredAt }))
              }}
              className="rounded-md bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-400">
              +3일
            </button>
          </div>

          <div className="flex items-center gap-4">
            <FormRender.Select
              itemKey={'role'}
              label={'권한'}
              required
              options={[
                { label: '사용자', value: 'USER' },
                { label: '관리자', value: 'ADMIN' },
              ]}
            />
            <FormRender.Select
              itemKey={'license'}
              label={'라이센스'}
              required
              options={[
                { label: 'A', value: 'A' },
                { label: 'S', value: 'S' },
              ]}
            />
            <FormRender.Select
              itemKey={'status'}
              label={'계정 상태'}
              options={[
                {
                  label: '활성',
                  value: USER_STATUS.ACTIVE,
                },
                {
                  label: '비활성',
                  value: USER_STATUS.INACTIVE,
                },
                {
                  label: '보류',
                  value: USER_STATUS.PENDING,
                },
              ]}
              required
            />
          </div>
          <FormRender.Number itemKey={'maxProductCount'} label={'최대 상품 검색 수'} required />
          <FormRender.Number itemKey={'remainingProductCount'} label={'남은 상품 검색 수'} required />
          <hr />
          {/* <FormRender.Number itemKey={'maxUploadProductCount'} label={'최대 업로드 상품 수'} required /> */}
          <FormRender.Number itemKey={'remainingUploadProductCount'} label={'남은 업로드 상품 수'} required />
          <hr />
          <FormRender.TextArea itemKey={'memo'} label={'메모'} placeholder={'메모'} />
          {/*<FormRender.Text itemKey={'bizNumber'} label={'사업자등록번호'} required placeholder={'사업자등록번호'} />*/}
          {/*<FormRender.Text itemKey={'bankName'} label={'은행명'} required placeholder={'예) 우리은행'} />*/}
          {/*<FormRender.Text itemKey={'bankAccount'} label={'계좌번호'} required placeholder={'예) 0000-000-000000'} />*/}
          {/*<FormRender.Text itemKey={'bankHolder'} label={'예금주'} required placeholder={'홍길동'} />*/}
          <hr />

          <ActionButton
            isLoading={isLoading}
            type={'submit'}
            onClick={() => {}}
            className="mt-8 block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            {item ? '수정' : '등록'}
          </ActionButton>
        </FormRender>
      </div>
    </div>
  )
}
