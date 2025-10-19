'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { Input } from '@repo/ui/components/input'
import { ExternalLink, Star, ShoppingCart, TrendingUp, TrendingDown, Minus, Search, Filter } from 'lucide-react'

interface Product {
  rank: number | string
  brand: string | null
  pcUrl: string
  price: number
  score: number | string | null
  mblUrl: string | null
  mallUrl: string
  mallName: string
  keepCount: number
  mallGrade: string
  overseaTp: string
  categories: Array<{ id: string; name: string }>
  deliveryFee: number
  reviewCount: number
  isBrandStore: number | string
  purchaseCount: number
}

interface ProductListProps {
  products: Product[]
  total: number
  keywordId?: string
}

type SortOption = 'rank' | 'price_asc' | 'price_desc' | 'score_desc' | 'purchase_desc' | 'review_desc'
type FilterOption = 'all' | 'brand_store' | 'free_delivery' | 'high_score'

export default function ProductList({ products, total, keywordId }: ProductListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('rank')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 필터링 및 정렬된 상품 목록
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.map(product => ({
      ...product,
      rank: typeof product.rank === 'string' ? parseInt(product.rank) || 0 : product.rank,
      brand: product.brand || '',
      score: typeof product.score === 'string' ? parseFloat(product.score) || 0 : product.score || 0,
      isBrandStore:
        typeof product.isBrandStore === 'string' ? parseInt(product.isBrandStore) || 0 : product.isBrandStore,
    }))

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.mallName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 카테고리 필터
    switch (filterBy) {
      case 'brand_store':
        filtered = filtered.filter(product => product.isBrandStore === 1)
        break
      case 'free_delivery':
        filtered = filtered.filter(product => product.deliveryFee === 0)
        break
      case 'high_score':
        filtered = filtered.filter(product => product.score >= 4.5)
        break
    }

    // 정렬
    switch (sortBy) {
      case 'rank':
        filtered.sort((a, b) => a.rank - b.rank)
        break
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'score_desc':
        filtered.sort((a, b) => b.score - a.score)
        break
      case 'purchase_desc':
        filtered.sort((a, b) => b.purchaseCount - a.purchaseCount)
        break
      case 'review_desc':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount)
        break
    }

    return filtered
  }, [products, searchTerm, filterBy, sortBy])

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const getRankChangeIcon = (rank: number, index: number) => {
    // 실제로는 이전 데이터와 비교해야 하지만, 여기서는 샘플로 처리
    const hasPreviousData = Math.random() > 0.3 // 70% 확률로 이전 데이터가 있다고 가정
    if (!hasPreviousData) return null // 이전 데이터가 없으면 아이콘 표시 안함

    const change = Math.random() > 0.5 ? 1 : -1
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-400" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-400" />
    return null
  }

  const getRankChangeColor = (rank: number, index: number) => {
    // 실제로는 이전 데이터와 비교해야 하지만, 여기서는 샘플로 처리
    const hasPreviousData = Math.random() > 0.3 // 70% 확률로 이전 데이터가 있다고 가정
    if (!hasPreviousData) return 'text-gray-400'

    const change = Math.random() > 0.5 ? 1 : -1
    if (change > 0) return 'text-red-400'
    if (change < 0) return 'text-green-400'
    return 'text-gray-400'
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>상품 목록</span>
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            총 {filteredAndSortedProducts.length.toLocaleString()}개 상품
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 필터 및 검색 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="브랜드명 또는 쇼핑몰명으로 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border-gray-600 bg-gray-700 pl-10 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={value => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-40 border-gray-600 bg-gray-700 text-white">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="brand_store">브랜드몰</SelectItem>
                <SelectItem value="free_delivery">무료배송</SelectItem>
                <SelectItem value="high_score">높은 평점</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40 border-gray-600 bg-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">순위순</SelectItem>
                <SelectItem value="price_asc">가격 낮은순</SelectItem>
                <SelectItem value="price_desc">가격 높은순</SelectItem>
                <SelectItem value="score_desc">평점 높은순</SelectItem>
                <SelectItem value="purchase_desc">구매량순</SelectItem>
                <SelectItem value="review_desc">리뷰순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="space-y-4">
          {paginatedProducts.map((product, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-700/50">
              {/* 순위 */}
              <div className="flex min-w-[80px] items-center gap-2">
                <span className="text-lg font-bold text-white">#{product.rank}</span>
                {(() => {
                  const hasPreviousData = Math.random() > 0.3
                  if (!hasPreviousData) return null // 이전 데이터가 없으면 변동 표시 안함

                  const change = Math.random() > 0.5 ? 1 : -1
                  return (
                    <div className="flex flex-col items-center">
                      {getRankChangeIcon(product.rank, index)}
                      <span className={`text-xs ${getRankChangeColor(product.rank, index)}`}>
                        {change > 0 ? `+${Math.floor(Math.random() * 5) + 1}` : `-${Math.floor(Math.random() * 5) + 1}`}
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* 상품 정보 */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="truncate font-medium text-white">{product.brand || '브랜드 없음'}</h3>
                  <Badge variant="outline" className="border-gray-500 text-xs text-gray-300">
                    {product.mallName}
                  </Badge>
                  {product.isBrandStore === 1 && (
                    <Badge className="bg-blue-900/20 text-xs text-blue-400">브랜드몰</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {typeof product.score === 'number' ? product.score.toFixed(1) : '0.0'}
                  </span>
                  <span>리뷰 {product.reviewCount.toLocaleString()}</span>
                  <span>찜 {product.keepCount.toLocaleString()}</span>
                  <span>구매 {product.purchaseCount.toLocaleString()}</span>
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="min-w-[120px] text-right">
                <div className="text-lg font-bold text-white">₩{product.price.toLocaleString()}</div>
                {product.deliveryFee > 0 && (
                  <div className="text-sm text-gray-400">+ 배송비 ₩{product.deliveryFee.toLocaleString()}</div>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => window.open(product.pcUrl, '_blank')}>
                  <ExternalLink className="mr-1 h-4 w-4" />
                  보기
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => window.open(product.mallUrl, '_blank')}>
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  쇼핑몰
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700">
              이전
            </Button>
            <span className="text-sm text-gray-400">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700">
              다음
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
