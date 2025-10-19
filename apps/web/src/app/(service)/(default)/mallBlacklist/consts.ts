'use client'

import { PATH } from '../../../../../consts/const'

export const baseUrl = PATH.MALL_BLACKLIST
export const title = '블랙리스트 관리'
export const tableColumns = [
  {
    headerName: 'id',
    field: 'id',
    width: 120,
    sortable: true,
    checkboxSelection: true,
    headerCheckboxSelection: true,
  },
  {
    headerName: '쇼핑몰 아이디',
    field: 'mallId',
    width: 200,
    sortable: true,
  },
  {
    headerName: '쇼핑몰 이름',
    field: 'mallName',
    width: 200,
    sortable: true,
  },
  {
    headerName: '비고',
    field: 'memo',
    width: 150,
    sortable: true,
  },
]
