'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import Filters from './Filters'
import SearchBar from './SearchBar'
import CustomDataGrid from '../DataGrid/CustomDataGrid'
import Pagination from './Pagination'
import { useServerAction } from '@repo/utils'
import { ConfirmModal } from '@repo/ui'

const INITIAL_SIZE = 20

interface Props {
  title: any
  basePath: any
  tableColumns?: any
  searchOption?: any
  filterOptions?: any[]
  listData?: any[]
  totalCount?: number
  pagination?: boolean
  gridKey?: string
  deleteMutation?: any
  isCreatable?: boolean
  saveMutation?: any
}

export default function EditableListTable({
  title,
  basePath,
  tableColumns,
  searchOption,
  filterOptions,
  listData,
  totalCount,
  pagination = true,
  gridKey,
  deleteMutation,
  isCreatable = false,
  saveMutation,
}: Props) {
  const [rowData, setRowData] = useState(listData)
  const router = useRouter()
  const [size, setSize] = useState<number>(INITIAL_SIZE)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { execute: executeDelete, isLoading: isDeleting } = useServerAction(deleteMutation, {
    onSuccess: () => {
      setIsDeleteOpen(false)
      router.refresh()
    },
  })
  const { execute: executeSave, isLoading: isSaving } = useServerAction(saveMutation)
  const gridRef = useRef<AgGridReact>(null)

  useEffect(() => {
    if (!listData) return
    setRowData(listData)
  }, [listData])

  async function deleteCheckedItems() {
    const deleteIds = gridRef.current?.api?.getSelectedRows()?.map(row => row.id)

    if (!deleteIds || deleteIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }
    await executeDelete(deleteIds)
  }

  useEffect(() => {
    //when keyboard event ctrl + s
    const handleKeyDown = e => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        e.stopPropagation()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [rowData])

  function handleSave() {
    const editedRows = rowData.filter(row => row.isEdited)
    if (editedRows.length === 0) return
    executeSave(editedRows)
  }

  return (
    <div className="h-full">
      <ConfirmModal
        title={'삭제'}
        description={'선택한 항목을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
        handleConfirm={deleteCheckedItems}
        isOpen={isDeleteOpen}
        handleClose={() => setIsDeleteOpen(false)}
      />
      <div className="flex h-full flex-col">
        <div className="flex items-center border-b">
          <div className="flex-auto">
            <h1 className="py-4 text-lg font-semibold leading-6 text-[#333333]">{title}</h1>
          </div>
          <div className="flex gap-6">
            {deleteMutation && (
              <button
                className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() => setIsDeleteOpen(true)}>
                삭제
              </button>
            )}
            {saveMutation && (
              <button
                className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-80"
                onClick={() => handleSave()}>
                저장
              </button>
            )}
            {isCreatable && (
              <button
                className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => {
                  const newRowData = [{ isNewRow: true, id: -1 }, ...rowData]
                  setRowData(newRowData)
                }}>
                추가
              </button>
            )}
          </div>
        </div>
        <Suspense>
          {(searchOption || filterOptions) && (
            <div className="flex items-center justify-between border-b py-4">
              <Filters filterOptions={filterOptions} />
              <SearchBar searchOption={searchOption} />
            </div>
          )}
        </Suspense>
        <div className="relative mt-4 flex-1">
          <CustomDataGrid
            gridRef={gridRef}
            columnDefs={tableColumns}
            rowData={rowData}
            gridKey={gridKey ?? basePath ?? undefined}
            height={'calc(100vh - 200px)'}
            getRowStyle={({ data }) => (data.isEdited ? { backgroundColor: '#DDD' } : {})}
            multiSortKey={'ctrl'}
          />
        </div>
        {pagination && <Pagination {...{ size, totalCount }} />}
      </div>
    </div>
  )
}
