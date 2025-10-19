'use client'
import { Product } from '@repo/database'
const markets = [
  {
    label: '스마트스토어',
    value: 'SmartStore',
    key: 'smartStoreProductId',
    deleteable: true,
  },
  {
    label: '쿠팡',
    value: 'Coupang',
    key: 'coupangProductId',
    deleteable: true,
  },
  {
    label: '11번가',
    value: 'Street11',
    key: 'street11ProductId',
    deleteable: true,
  },
  {
    label: '지마켓',
    value: 'GMARKET',
    key: 'gmarketProductId',
    deleteable: false,
  },
  {
    label: '옥션',
    value: 'Auction',
    key: 'octionProductId',
    deleteable: false,
  },
]
export function MarketManage({ product, handleDelete }: { product: Product; handleDelete: (market: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-full rounded-md border">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr className="divide-x">
              {markets.map(market => (
                <th key={market.value}>{market.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="divide-x text-sm *:w-1/5 *:px-2 *:py-1 *:text-center">
              {markets.map(market => {
                const productId = product[market.key]
                return (
                  <td key={`${market.value}-${product.id}`}>
                    {productId && (
                      <div className="flex items-center justify-center gap-2">
                        <div>상품번호 : {product[market.key]}</div>
                        {market.deleteable && (
                          <button
                            className="shrink-0 rounded-md bg-red-500 px-2 py-1 text-white"
                            onClick={() => handleDelete(market.value)}>
                            삭제
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <button className="shrink-0 rounded-md bg-red-500 px-2 py-1 text-white" onClick={() => handleDelete('all')}>
        전체 삭제
      </button>
    </div>
  )
}
