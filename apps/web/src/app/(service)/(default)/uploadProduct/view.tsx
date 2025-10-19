'use client'

import {
  createProduct,
  deleteProducts,
  getImageBlob,
  refineDetailImages,
  saveProducts,
  updateEsmResult,
} from './serverAction'
import { useAsyncEffect, useServerAction } from '@repo/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Filters from '../../(_components)/ListTable/Filters'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Product, User, Category, MarketSetting } from '@repo/database'
import UploadProductProduct from './(_components)/Product'
import _ from 'lodash'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'
import { handleEsmUpload as handleEsmUploadFn, createEsmEventListener } from './function'
import { ExecutingModal, UploadingModal, ConfirmModal } from './(_components)/Modals'

type data = Product

export default function ProductView({
  listData,
  dateString,
  user,
  categories,
  marketSetting,
  patch,
}: {
  listData: data[]
  dateString: string
  user: User
  categories: Category[]
  marketSetting: MarketSetting
  patch: { url: string; date: string; version: string; detail: string } | null
}) {
  if (typeof window === 'undefined') return null
  const router = useRouter()
  const [userState, setuserState] = useState(user)
  const [listDataState, setListDataState] = useState(listData ?? [])
  //엑셀 출력 등 상품 갯수가 많아야 몇백개라 client에서 페이지네이션.
  const [selectedProductIds, setSelectedProductIds] = useState<bigint[]>([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(50)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isAutoUploading, setIsAutoUploading] = useState(false)
  const [isESMUploading, setIsESMUploading] = useState(false)
  const [isOtherUploading, setIsOtherUploading] = useState(false)
  const [intervalRef, setIntervalRef] = useState<NodeJS.Timeout | null>(null)
  const [uploadingResults, setUploadingResults] = useState<any[]>([])
  const [isResultOpen, setisResultOpen] = useState(false)
  const [esmChild, setEsmChild] = useState(null)
  // useRef를 사용하여 현재 인덱스를 추적
  const currentIdxRef = useRef(0)
  const totalCount = listData.length
  const totalPages = Math.ceil(totalCount / size)
  const currentListData = listDataState.slice((page - 1) * size, page * size)

  const { execute: executeDelete, isLoading: isDeleting } = useServerAction(deleteProducts, {
    onSuccess: ({ message }) => {
      toast.success(message)
      setIsDeleteConfirmOpen(false)
      setSelectedProductIds([])
      router.refresh()
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  const { execute: executeCreateProduct, isLoading: isCreating } = useServerAction(createProduct, {
    onSuccess: ({ message, data }) => {
      // setUploadingResults(prev => [...prev, data])
      setUploadingResults(prev => {
        const newResults = _.cloneDeep(prev)
        let targetResult = newResults.findIndex(result => result.productId === data.productId)
        if (targetResult !== -1) {
          newResults[targetResult] = { ...data, ...newResults[targetResult] }
        } else {
          newResults.push(data)
        }
        return newResults
      })
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
      setIsAutoUploading(false)
    },
  })

  const { execute: executeRefineDetails, isLoading: isRefining } = useServerAction(refineDetailImages, {
    onSuccess: ({ message }) => {
      toast.success(message)
      setSelectedProductIds([])
      router.refresh()
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  useEffect(() => {
    if (listData) {
      setListDataState(listData)
      // setSelectedProductIds([])
    }
  }, [listData])

  useEffect(() => {
    //scroll to top
    window?.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    setPage(1)
    setSelectedProductIds([])
  }, [dateString])

  const { execute: executeSave, isLoading: isSaving } = useServerAction(saveProducts, {
    onSuccess: ({ message }) => {
      router.refresh()
      toast.success(message)
    },
    onError: ({ message }) => {
      toast.error(message ?? '에러가 발생했습니다.')
    },
  })

  function handleConfirm() {
    setIsAutoUploading(true)
    setIsConfirmOpen(false)
  }

  function handleChange({ productId, name, value }) {
    setListDataState(prev => {
      const newListData = _.cloneDeep(prev)
      const targetProduct = newListData.find(product => product.id === productId)
      _.set(targetProduct, name, value)
      _.set(targetProduct, 'isEdited', true)
      return newListData
    })
  }

  function handleSelect(productId: bigint) {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(prev => prev.filter(id => id !== productId))
    } else {
      setSelectedProductIds(prev => [...prev, productId])
    }
  }

  async function handleDelete() {
    await handleSaveAll()
    await executeDelete({ productIds: selectedProductIds })
  }

  const handleSaveAll = useCallback(async () => {
    if (isAutoUploading) return
    const targetProducts = listDataState.filter(product => (product as any).isEdited)
    await executeSave({ products: targetProducts })
  }, [listDataState, executeSave, isAutoUploading])

  useEffect(() => {
    //on ctrl+s handleSaveAll
    const handleSaveAllData = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSaveAll()
      }
    }
    window.addEventListener('keydown', handleSaveAllData)
    return () => {
      window.removeEventListener('keydown', handleSaveAllData)
    }
  }, [handleSaveAll])

  useEffect(() => {
    if (!isOtherUploading) {
      clearInterval(intervalRef)
      setIntervalRef(null)
      currentIdxRef.current = 0
      return
    }

    setisResultOpen(true)
    handleEsmUpload(selectedProductIds[0])

    const interval = setInterval(() => {
      if (currentIdxRef.current >= selectedProductIds.length) {
        currentIdxRef.current = 0
        clearInterval(interval)
        setIntervalRef(null)
        setIsOtherUploading(false)
        router.refresh()
        return
      }

      const productId = selectedProductIds[currentIdxRef.current]
      executeCreateProduct({ productId })
      currentIdxRef.current += 1
    }, 5000)

    setIntervalRef(interval)

    return () => {
      clearInterval(intervalRef)
      clearInterval(interval)
    }
  }, [isOtherUploading, selectedProductIds])

  useAsyncEffect(async () => {
    const user = await getServerUser()
    setuserState(user)
  }, [isConfirmOpen])

  // 리팩토링: ESM 업로드 함수
  const handleEsmUpload = (productId: bigint) => {
    if (userState.remainingUploadProductCount <= 0) return
    handleEsmUploadFn(productId, listDataState, marketSetting, setEsmChild, setUploadingResults)
  }

  // 리팩토링: ESM 이벤트 리스너
  const esmEventListener = useCallback(
    createEsmEventListener(selectedProductIds, isESMUploading, handleEsmUpload, setUploadingResults),
    [selectedProductIds, isESMUploading, userState.maxUploadProductCount],
  )

  useEffect(() => {
    if (!window || !esmEventListener) return

    //add event listener
    window.removeEventListener('message', esmEventListener)
    window.addEventListener('message', esmEventListener)
    return () => {
      window.removeEventListener('message', esmEventListener)
    }
  }, [window, esmEventListener])

  useEffect(() => {
    if (isAutoUploading) {
      setIsESMUploading(true)
      setIsOtherUploading(true)
    } else {
      setIsESMUploading(false)
      setIsOtherUploading(false)
    }
  }, [isAutoUploading])

  useEffect(() => {
    if (!isOtherUploading && !isESMUploading) {
      setIsAutoUploading(false)
    }
  }, [isOtherUploading, isESMUploading])

  return (
    <div className="relative min-h-screen w-full p-4">
      <div className="flex w-full items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold">상품 일괄 업로드</h1>
        {patch && (
          <div className="text-sm font-medium text-red-500">
            새 패치 버전 : <span className="font-bold"> {patch.version}-Master</span> ({patch.date})
            <div className="text-sm text-gray-700">{patch.detail || ''}</div>
            <a href={patch.url} target="_blank" rel="noopener noreferrer" className="block text-blue-500 underline">
              패치 다운로드
            </a>
          </div>
        )}
      </div>
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
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">{selectedProductIds.length}개 선택</div>
            <button
              className="rounded-md bg-gray-500 px-4 py-2 text-white"
              onClick={() => {
                const currentPageProductIds = currentListData.map(product => product.id)
                const isAllSelected = currentPageProductIds.every(id => selectedProductIds.includes(id))
                if (isAllSelected) {
                  setSelectedProductIds(selectedProductIds.filter(id => !currentPageProductIds.includes(id)))
                } else {
                  const newSelectedProductIds = [...selectedProductIds, ...currentPageProductIds]
                  const selectedProductIdsSet = new Set(newSelectedProductIds)
                  setSelectedProductIds(Array.from(selectedProductIdsSet))
                }
              }}>
              현재 페이지 전체 선택
            </button>
            <button
              className="rounded-md bg-gray-500 px-4 py-2 text-white"
              onClick={() => {
                if (selectedProductIds.length === listData.length) {
                  setSelectedProductIds([])
                } else {
                  setSelectedProductIds(listDataState.map(product => product.id))
                }
              }}>
              전체 선택
            </button>
            <button
              className="rounded-md bg-yellow-700 px-4 py-2 text-white disabled:opacity-50"
              onClick={async () => {
                await handleSaveAll()
                await executeRefineDetails({ productIds: selectedProductIds })
              }}
              disabled={selectedProductIds.length === 0 || isRefining || isSaving}>
              이미지 변환
            </button>
            <button
              className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
              disabled={selectedProductIds.length === 0}
              onClick={() => {
                setIsConfirmOpen(true)
              }}>
              업로드
            </button>
            <button
              className="rounded-md bg-red-500 px-4 py-2 text-white disabled:opacity-50"
              disabled={selectedProductIds.length === 0 || isDeleting || isSaving}
              onClick={() => {
                setIsDeleteConfirmOpen(true)
              }}>
              삭제
            </button>
          </div>
        </div>
        <div className="mt-2 flex w-full items-center gap-4 px-4">
          <button
            className="w-full rounded-md bg-green-500 px-8 py-2 text-white"
            onClick={async () => {
              await handleSaveAll()
            }}>
            저장
          </button>
        </div>
      </div>
      <div className="mt-4 w-full space-y-4 pb-24">
        {currentListData.length === 0 && <div className="py-4 font-medium">수집된 상품이 없습니다.</div>}
        {currentListData.map((product, idx) => {
          const isSelected = selectedProductIds.includes(product.id)
          return (
            <UploadProductProduct
              key={product.id.toString()}
              product={product as any}
              handleChange={handleChange}
              categories={categories}
              isSelected={isSelected}
              handleSelect={handleSelect}
            />
          )
        })}
      </div>
      {/*pagination*/}
      <div className="fixed bottom-0 left-0 w-full bg-white py-2 shadow-md">
        <div className="flex items-center justify-center gap-2">
          {totalPages > 0 && (
            <select
              value={size}
              onChange={e => {
                setSize(Number(e.target.value))
              }}
              className="rounded-md border border-gray-300 pl-2 pr-6 text-sm">
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          )}
          <button
            className="h-8 rounded-md bg-blue-500 px-4 text-white disabled:opacity-50"
            disabled={page === 1}
            onClick={() => {
              setPage(page - 1)
            }}>
            이전
          </button>
          {/*<div className="mx-4">{page}</div>*/}

          {Array.from({ length: totalPages }).map((_, idx) => {
            return (
              <button
                key={idx}
                className={`h-8 rounded-md border border-gray-300 px-2 text-sm ${page === idx + 1 ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => {
                  setPage(idx + 1)
                }}>
                {idx + 1}
              </button>
            )
          })}
          <button
            className="h-8 rounded-md bg-blue-500 px-4 text-white disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => {
              setPage(page + 1)
            }}>
            다음
          </button>
          <div className="text-[15px] font-semibold">총 {totalCount}건</div>
        </div>
      </div>
      {/* {(isMatching || isDeleting || isMatchingMany) && <ExecutingModal />} */}
      {isConfirmOpen && (
        <ConfirmModal
          execute={handleConfirm}
          onClose={() => setIsConfirmOpen(false)}
          message={
            <div>
              <div className="text-center text-lg font-medium text-gray-900">
                <span className="text-red-500">!! 반드시 수정사항을 저장 후 진행 해 주세요 !!</span>
                <br />
                선택된 상품들의 업로드를 진행하시겠습니까?
                <br />
                셀로직에서 소싱한 상품 정보는 참고용입니다.
                <br />
                상품정보 수정 없이 업로드 하는 행위는 저작권법에 의해 저촉 될 수 있으며, 셀로직은 이러한 행위를 권장하지
                않습니다.
                <br />
                해당 행위로 발생한 법적 책임은 사용자에게 있음을 동의합니다.
                <br />
                <div className="mt-2 font-semibold">
                  잔여 상품 등록 횟수 : {userState.remainingUploadProductCount} / {userState.maxUploadProductCount}
                </div>
              </div>
            </div>
          }
        />
      )}
      {isDeleteConfirmOpen && (
        <ConfirmModal
          execute={handleDelete}
          onClose={() => setIsDeleteConfirmOpen(false)}
          message={
            <div>
              <div className="text-center text-lg font-medium text-gray-900">
                선택한 상품들을 삭제하시겠습니까?
                <br />
                <span className="text-red-500">!! 삭제한 상품은 복구 할 수 없습니다 !!</span>
                <br />
                대기중인 상품만 삭제 할 수 있으며, 이미 업로드가 진행된 상품은 삭제 할 수 없습니다.
              </div>
            </div>
          }
        />
      )}
      {(isDeleting || isRefining) && <ExecutingModal />}
      {(isAutoUploading || isResultOpen) && (
        <UploadingModal
          results={uploadingResults}
          onClose={() => {
            setisResultOpen(false)
            setIsAutoUploading(false)
            setUploadingResults([])
          }}
          onStop={() => setIsAutoUploading(false)}
          isAutoUploading={isAutoUploading}
          products={listDataState}
          totalCount={selectedProductIds.length}
        />
      )}
    </div>
  )
}
