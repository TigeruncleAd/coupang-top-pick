'use client'

import { PATH } from '../../../../../consts/const'
import { kdayjs } from '@repo/utils'

export const baseUrl = PATH.USER
export const title = '셀러 관리'
export const tableColumns = [
  {
    headerName: 'id',
    field: 'id',
    width: 120,
    sortable: true,
  },
  {
    headerName: '계정ID',
    field: 'accountId',
    width: 200,
    sortable: true,
  },
  {
    headerName: '이름',
    field: 'name',
    width: 200,
    sortable: true,
  },
  {
    headerName: '최대 상품 검색',
    field: 'maxProductCount',
    width: 150,
    sortable: true,
    valueFormatter: ({ value }) => value?.toLocaleString?.('ko-KR') ?? 0,
  },
  {
    headerName: '잔여 상품 검색',
    field: 'remainingProductCount',
    width: 150,
    sortable: true,
  },
  // {
  //   headerName: '최대 업로드 상품 수',
  //   field: 'maxUploadProductCount',
  //   width: 150,
  //   sortable: true,
  // },
  {
    headerName: '잔여 업로드 상품 수',
    field: 'remainingUploadProductCount',
    width: 150,
    sortable: true,
  },
  {
    headerName: '계정 만료일시',
    field: 'expiredAt',
    valueFormatter: ({ value }) => kdayjs(value).format('YYYY-MM-DD HH:mm'),
    cellStyle: ({ value }) => {
      if (kdayjs().isAfter(value)) {
        return { color: 'red' }
      }
      return {}
    },
    sortable: true,
  },
  {
    headerName: '계정 상태',
    field: 'status',
    width: 120,
    sortable: true,
  },
  {
    headerName: '라이센스',
    field: 'license',
    width: 100,
    sortable: true,
  },
  {
    headerName: '권한',
    field: 'role',
    sortable: true,
  },
]

function formatRole({ value }) {
  switch (value) {
    case 'USER':
      return '사용자(셀러)'
    case 'AGENCY':
      return '대행사 관리자'
    case 'DISTRIBUTOR':
      return '총판 관리자'
    case 'ADMIN':
      return '관리자'
    default:
      return ''
  }
}
