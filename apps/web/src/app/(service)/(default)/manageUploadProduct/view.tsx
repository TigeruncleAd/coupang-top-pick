'use client'

import { deleteUploadedProduct } from './serverAction'
import { useServerAction } from '@repo/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Filters from '../../(_components)/ListTable/Filters'
import { useEffect, useRef, useState } from 'react'
import { LoadingCircle } from '@repo/ui'
import { Product, User, Category } from '@repo/database'
import UploadProductProduct from './(_components)/Product'
import _ from 'lodash'
import SearchBar from '../../(_components)/ListTable/SearchBar'
import Pagination from '../../(_components)/ListTable/Pagination'

type data = Product
const size = 50

export default function ManageUploadProductView({
  listData,
  dateString,
  user,
  totalCount,
}: {
  listData: data[]
  dateString: string
  user: User
  totalCount: number
}) {
  const router = useRouter()
  const [deleteInfo, setDeleteInfo] = useState<{ productId: bigint; market: string } | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const { execute: executeDelete, isLoading: isDeleting } = useServerAction(deleteUploadedProduct, {
    onSuccess: ({ message }) => {
      router.refresh()
      toast.success(message)
      setIsDeleteConfirmOpen(false)
      setDeleteInfo(null)
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  async function handleDelete({ productId, market }) {
    setIsDeleteConfirmOpen(true)
    setDeleteInfo({ productId, market })
    // await executeDelete({ productId, market })
  }

  async function handleDeleteConfirm() {
    if (!deleteInfo) return

    await executeDelete(deleteInfo)
  }

  return (
    <div className="relative min-h-screen w-full p-4">
      <h1 className="mb-4 text-2xl font-bold">업로드 상품 관리</h1>
      <div className="sticky top-0 z-10 w-full rounded-md bg-white py-4 shadow-md">
        <div className="flex w-full items-center justify-between px-4">
          <Filters
            filterOptions={[
              {
                label: '일자',
                key: 'date',
                type: 'datetime',
                defaultValue: dateString,
              },
            ]}
          />
          <SearchBar
            searchOption={{
              options: [
                {
                  label: '내 상품명',
                  value: 'name',
                },
              ],
            }}
          />
        </div>
      </div>
      <div className="mt-4 w-full space-y-4 pb-12">
        {listData.length === 0 && <div className="min-h-[50vh] py-4 font-medium">업로드된 상품이 없습니다.</div>}
        {listData.map((product, idx) => {
          return (
            <UploadProductProduct
              key={product.id.toString()}
              product={product as any}
              handleDelete={handleDelete}
              // handleChange={handleChange}
              // isSelected={isSelected}
              // handleSelect={handleSelect}
            />
          )
        })}
      </div>
      {/*pagination*/}
      <div className="fixed bottom-0 left-0 right-0 w-full lg:pl-72">
        <div className="bg-white">
          <Pagination size={size} totalCount={totalCount} />
        </div>
      </div>
      {isDeleteConfirmOpen && (
        <ConfirmModal
          execute={handleDeleteConfirm}
          onClose={() => {
            setIsDeleteConfirmOpen(false)
            setDeleteInfo(null)
          }}
          message={
            <div>
              <div className="text-center text-lg font-medium text-gray-900">
                선택한 상품의 업로드 상품을 삭제하시겠습니까?
                <br />
                <span className="text-red-500">
                  !! 삭제한 상품은 복구 할 수 없습니다 !!
                  <br />
                  삭제한 상품은 다시 업로드 할 수 없습니다.
                </span>
              </div>
            </div>
          }
        />
      )}
      {isDeleting && <ExecutingModal />}
    </div>
  )
}

function ExecutingModal() {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-md bg-white p-12">
        <div className="text-lg font-semibold text-gray-700">처리중입니다</div>
        <LoadingCircle />
      </div>
    </div>
  )
}

function ConfirmModal({ execute, onClose, message }) {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-md bg-white p-12">
        {message}
        <div className="mt-6 flex w-full justify-center gap-4">
          <button
            className="rounded-md bg-blue-500 px-4 py-2 text-white"
            onClick={() => {
              execute()
            }}>
            확인
          </button>
          <button
            className="rounded-md bg-gray-300 px-4 py-2"
            onClick={() => {
              onClose()
            }}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
