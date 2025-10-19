import * as xlsx from 'xlsx'
import _ from 'lodash'
import { kdayjs } from '@repo/utils'
import { boldFont, normalFont } from './style'

export function printHeySellerExcel(listData) {
  const columnDefs = [
    {
      header: '카테고리',
      value: row => {
        if (!row.category || row.category?.length === 0) return ''
        return row.category?.slice(-1)[0]?.label
      },
      width: 10,
    },
    { header: '상품명', value: row => row.myName, width: 50 },
    { header: '글자수 (Byte)', value: row => (row.myName?.length || 0) * 2, width: 13 },
    { header: '배대지 비용', value: row => row.myDeliveryFee, width: 13 },
    { header: '수집링크', value: row => row.selectedTaobaoProduct?.url, width: 50 },
    { header: '보스 메시지', value: row => row.memo || '', width: 50 },
    { header: '메모 글자수', value: row => (row.memo?.length || 0) * 2, width: 13 },
    { header: '주의사항', value: row => '', width: 13 },
  ]
  handleExcelDownload({ listData:[{},...listData], columnDefs, sheetName: '상품 수집', fileName: '헤이셀러' })
}

export async function printWindlyExcel(listData) {
  const fileRes = await fetch('/assets/excel/windly.xlsx')
  const fileArrayBuffer = await fileRes.arrayBuffer()
  const wb = xlsx.read(fileArrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  //from row 7
  const columnDefs = [
    { header: 'No.', value: (row, idx) => idx + 1, width: 10 },
    { header: '쿠팡 카테고리 [선택]', value: row => '', width: 10 },
    {
      header: '네이버 카테고리 [선택]',
      value: row => row.category?.map(category => category.label).join('>') || '',
      width: 10,
    },
    { header: '상품명 (스마트스토어, 쿠팡) [선택]', value: row => row.myName, width: 30 },
    { header: '상품 태그 [선택]', value: row => '', width: 30 },
    { header: '수집 URL [필수]', value: row => row.selectedTaobaoProduct?.url, width: 30 },
    { header: '배대지 비용 설정', value: row => row.myDeliveryFee, width: 30 },
    { header: '배송비유형', value: row => (row.myDeliveryFee === 0 ? '무료' : '유료'), width: 30 },
    { header: '기본 배송비', value: row => '', width: 30 },
    { header: '반품 배송비', value: row => '', width: 30 },
    { header: '교환 배송비', value: row => '', width: 30 },
    { header: '제조사', value: row => '', width: 30 },
    { header: '브랜드', value: row => '', width: 30 },
    { header: '모델', value: row => '', width: 30 },
  ]

  const rows = listData.map((row, idx) => {
    return columnDefs.map(column => {
      const value = column.value(row, idx)
      return {
        v: value,
        t: typeof value === 'number' ? 'n' : 's',
        s: normalFont,
      }
    })
  })
  const newWb = xlsx.utils.book_new()
  xlsx.utils.sheet_add_aoa(ws, rows, { origin: 'A7' })
  xlsx.utils.book_append_sheet(newWb, ws, 'Sheet1')

  xlsx.writeFile(newWb, `windly_${kdayjs().format('YYYY-MM-DD')}.xlsx`)
}

export function handleExcelDownload({ listData, columnDefs, sheetName, fileName }) {
  const wb = xlsx.utils.book_new()

  //const headers = ['work.name', 'round', 'itemCode', 'customerName', 'itemName']

  let rows = _.union(
    [
      columnDefs.map((column, idx, arr) => {
        return {
          v: column.header,
          t: 's',
          s: boldFont,
        }
      }),
    ],
    listData.map(row => {
      return columnDefs.map((column, idx, arr) => {
        const value = column.value(row)
        return {
          v: value,
          t: typeof value === 'number' ? 'n' : 's',
          s: normalFont,
        }
      })
    }),
  )

  // STEP 3: Create worksheet with rows; Add worksheet to workbook
  const ws = xlsx.utils.aoa_to_sheet(rows)

  // const merge = [
  //   { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
  //   { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 2 } }
  // ]

  // ws["!merges"] = merge

  ws['!cols'] = columnDefs.map(column => ({ wch: column.width }))

  const wsrows = [{}, { hpt: 28 }]
  ws['!rows'] = wsrows

  xlsx.utils.book_append_sheet(wb, ws, sheetName)

  // STEP 4: Write Excel file to browser
  xlsx.writeFile(wb, `${fileName}_${kdayjs().format('YYYY-MM-DD')}.xlsx`)
}
