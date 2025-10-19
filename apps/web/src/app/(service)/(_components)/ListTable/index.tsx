'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import CustomDataGrid from '../DataGrid/CustomDataGrid'
import { useRouter } from 'next/navigation'
import Filters from './Filters'
import SearchBar from './SearchBar'
import Pagination from './Pagination'
import { AgGridReact } from 'ag-grid-react'
import { useServerAction } from '@repo/utils'
import { ConfirmModal } from '@repo/ui'
import { toast } from 'sonner'

const INITIAL_SIZE = 20

interface Props {
  title: any
  basePath: any
  tableColumns?: any
  deleteMutation?: any
  searchOption?: any
  filterOptions?: any[]
  listData?: any[]
  totalCount?: number
  isCreatable?: boolean
  pagination?: boolean
  gridKey?: string
  isEditable?: boolean
  actionButtons?: any
  EditModal?: any
  isPrintable?: boolean
}

export default function ListTable({
  title,
  basePath,
  tableColumns,
  deleteMutation,
  searchOption,
  filterOptions,
  listData,
  totalCount,
  actionButtons,
  isCreatable = false,
  pagination = true,
  isEditable = true,
  EditModal = null,
  gridKey,
  isPrintable = false,
}: Props) {
  const [rowData, setRowData] = useState(listData)
  const router = useRouter()
  const [size, setSize] = useState<number>(INITIAL_SIZE)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const { execute: executeDelete, isLoading: isDeleting } = useServerAction(deleteMutation, {
    onSuccess: data => {
      toast.success(data?.message ?? '삭제되었습니다.')
      setIsDeleteOpen(false)
      router.refresh()
    },
    onError: error => {
      toast.error(error?.message ?? '삭제에 실패했습니다.')
      router.refresh()
    },
  })
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

  function handleModifyItemClick(row) {
    if (EditModal) {
      setEditItem(row)
      setIsEditModalOpen(true)
    } else {
      router.push(`${basePath}/edit/${row.id}`)
    }
  }

  function handleCreateItemClick() {
    if (EditModal) {
      setEditItem(null)
      setIsEditModalOpen(true)
    } else {
      router.push(`${basePath}/edit`)
    }
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false)
    setEditItem(null)
  }

  function handlePrint() {
    gridRef?.current?.api.exportDataAsCsv()
  }

  const columnDefs = isEditable
    ? [
        ...tableColumns,
        {
          headerName: '수정',
          valueGetter: () => '수정',
          cellStyle: { color: '#007bff', cursor: 'pointer' },
          onCellClicked: param => handleModifyItemClick(param.data),
          width: 80,
        },
      ]
    : [...tableColumns]

  return (
    <div className="h-full">
      {EditModal && <EditModal item={editItem} isOpen={isEditModalOpen} onClose={handleCloseEditModal} />}
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
            {actionButtons ? actionButtons : null}
            {isPrintable && (
              <button
                className="block rounded-md bg-blue-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={handlePrint}>
                출력
              </button>
            )}
            {deleteMutation && (
              <button
                className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() => setIsDeleteOpen(true)}>
                삭제
              </button>
            )}
            {isCreatable && (
              <button
                className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={handleCreateItemClick}>
                등록
              </button>
            )}
          </div>
        </div>
        <Suspense>
          {(searchOption || filterOptions) && (
            <div className="mb-4 flex items-center justify-between border-b py-4">
              <Filters filterOptions={filterOptions} />
              <SearchBar searchOption={searchOption} />
            </div>
          )}
        </Suspense>
        <div className="flex-1">
          <CustomDataGrid
            gridRef={gridRef}
            columnDefs={columnDefs}
            rowData={rowData}
            gridKey={gridKey ?? basePath ?? undefined}
          />
        </div>
        {pagination && <Pagination {...{ size, totalCount }} />}
      </div>
    </div>
  )
}
