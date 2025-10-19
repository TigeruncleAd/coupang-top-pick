'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Badge } from '@repo/ui/components/badge'
import { Plus, Search, ExternalLink, Trash2 } from 'lucide-react'

interface CompetitorProduct {
  id: string
  name: string
  url: string
  storeName: string
  productImage: string
  price: number
  rating: number
  reviewCount: number
  addedAt: string
}

interface CompetitorProductListProps {
  products: CompetitorProduct[]
  onAddProduct: (url: string) => void
  onRemoveProduct: (id: string) => void
  onViewProduct: (product: CompetitorProduct) => void
  isLoading?: boolean
}

export default function CompetitorProductList({
  products,
  onAddProduct,
  onRemoveProduct,
  onViewProduct,
  isLoading = false,
}: CompetitorProductListProps) {
  const [newProductUrl, setNewProductUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddProduct = async () => {
    if (!newProductUrl.trim()) return

    setIsAdding(true)
    try {
      await onAddProduct(newProductUrl.trim())
      setNewProductUrl('')
    } catch (error) {
      console.error('상품 추가 실패:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Plus className="h-5 w-5" />
          경쟁 상품 추가
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 상품 URL 입력 */}
        <div className="flex gap-2">
          <Input
            placeholder="상품 URL을 입력하세요"
            value={newProductUrl}
            onChange={e => setNewProductUrl(e.target.value)}
            className="border-gray-600 bg-gray-700 text-white"
            onKeyPress={e => e.key === 'Enter' && handleAddProduct()}
          />
          <Button
            onClick={handleAddProduct}
            disabled={!newProductUrl.trim() || isAdding || isLoading}
            className="bg-blue-600 hover:bg-blue-700">
            {isAdding || isLoading ? '추가 중...' : '추가'}
          </Button>
        </div>

        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="rounded-lg border border-blue-500 bg-blue-900/20 p-4">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent"></div>
              <span>경쟁 상품 데이터를 수집하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* 추가된 경쟁 상품 목록 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">추가된 경쟁 상품 ({products.length}개)</h3>
          {products.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Search className="mx-auto mb-2 h-12 w-12" />
              <p>아직 추가된 경쟁 상품이 없습니다.</p>
              <p className="text-sm">상품 URL을 입력하여 경쟁 상품을 추가해보세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-700/50 p-3 hover:bg-gray-700">
                  <img
                    src={product.productImage}
                    alt={product.name}
                    className="h-12 w-12 rounded object-cover"
                    onError={e => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.src =
                          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNCAxOEMxOS41ODE3IDE4IDE2IDIxLjU4MTcgMTYgMjZDMjQgMzQuODM2NiAxOS41ODE3IDQwIDI0IDQwQzI4LjQxODMgNDAgMzIgMzQuODM2NiAzMiAyNkMzMiAyMS41ODE3IDI4LjQxODMgMTggMjQgMThaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0yNCAxMkMxOS41ODE3IDEyIDE2IDE1LjU4MTcgMTYgMjBWMjJDMjYgMjkuNzMyIDE5LjU4MTcgMzYgMjQgMzZIMjRDMjguNDE4MyAzNiAzMiAyOS43MzIgMzIgMjJWMjBDMzIgMTUuNTgxNyAyOC40MTgzIDEyIDI0IDEySDI0WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'
                        e.currentTarget.dataset.fallback = 'true'
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-white">{product.name}</h4>
                    <p className="text-xs text-gray-400">{product.storeName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-300">{product.price.toLocaleString()}원</span>
                      <Badge variant="outline" className="border-gray-500 text-xs text-gray-300">
                        {product.rating}★
                      </Badge>
                      <span className="text-xs text-gray-400">리뷰 {product.reviewCount.toLocaleString()}개</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProduct(product)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-600">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveProduct(product.id)}
                      className="border-red-600 text-red-300 hover:bg-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
