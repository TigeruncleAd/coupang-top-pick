import { Product } from '@repo/database'
import { LoadingCircle } from '@repo/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog'
// import { Button } from '@repo/ui/components/button'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table'

/**
 * 실행 중 모달 컴포넌트
 */
export function ExecutingModal() {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>처리중입니다</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <LoadingCircle />
        </div>
      </DialogContent>
    </Dialog>
  )
}

type UploadingModalProps = {
  results: any[]
  onClose: () => void
  onStop: () => void
  isAutoUploading: boolean
  products: Product[]
  totalCount: number
}

/**
 * 업로드 중 모달 컴포넌트
 */
export function UploadingModal(props: UploadingModalProps) {
  const { results, onClose, onStop, isAutoUploading, products, totalCount } = props
  const markets = ['SmartStore', 'Coupang', 'ESM', 'Street11']

  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-md bg-white p-12">
        <div className="text-center text-lg font-semibold text-gray-700">
          {isAutoUploading ? '상품 등록 중입니다.' : '상품 등록이 완료되었습니다.'} ({results?.length || 0}/{totalCount}
          )
        </div>
        <div className="mt-4 max-h-[70vh] overflow-y-auto">
          <table className="w-full divide-x divide-y divide-black border border-black">
            <thead>
              <tr className="divide-x divide-black text-center *:px-2 *:text-center">
                <th>상품명</th>
                {markets.map(market => (
                  <th key={market}>{market}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => {
                const productName = products.find(product => product.id === result.productId)?.name
                return (
                  <tr
                    key={result.productId?.toString() ?? idx}
                    className="divide-x divide-black text-center *:w-1/5 *:px-2 *:text-center *:text-sm">
                    <td>{productName}</td>
                    {markets.map(market => (
                      <td key={`${result.productId}-${market}`}>{result[market]?.data?.message || ''}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex w-full justify-center gap-4">
          {isAutoUploading && (
            <button
              className="rounded-md bg-red-500 px-4 py-2 text-white"
              onClick={() => {
                onStop()
              }}>
              중단
            </button>
          )}
          <button
            className="rounded-md bg-blue-500 px-4 py-2 text-white"
            onClick={() => {
              onClose()
            }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

type ConfirmModalProps = {
  execute: () => void
  onClose: () => void
  message: React.ReactNode
}

/**
 * 확인 모달 컴포넌트
 */
export function ConfirmModal(props: ConfirmModalProps) {
  const { execute, onClose, message } = props

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
