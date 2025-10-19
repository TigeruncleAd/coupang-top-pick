'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { ChevronRight } from 'lucide-react'
import { getHierarchicalCategories } from '@/serverActions/analyze/category.actions'
import { useEffect } from 'react'

interface CategoryNode {
  id: bigint
  name: string
  level: number
  children?: CategoryNode[]
}

interface CategorySelectorProps {
  onCategoryChange: (categoryId: string | null, categoryName: string) => void
  placeholder?: string
  showAllOption?: boolean
  maxLevel?: number // 최대 선택 가능한 레벨 (1, 2, 3, 4)
  initialCategoryId?: string // 초기 선택된 카테고리 ID
}

export default function CategorySelector({
  onCategoryChange,
  placeholder = '카테고리 선택',
  showAllOption = true,
  maxLevel = 4,
  initialCategoryId,
}: CategorySelectorProps) {
  const [selectedCategory1, setSelectedCategory1] = useState<CategoryNode | null>(null)
  const [selectedCategory2, setSelectedCategory2] = useState<CategoryNode | null>(null)
  const [selectedCategory3, setSelectedCategory3] = useState<CategoryNode | null>(null)
  const [selectedCategory4, setSelectedCategory4] = useState<CategoryNode | null>(null)

  // 계층적 카테고리 조회
  const { data: categoryData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['hierarchicalCategories'],
    queryFn: getHierarchicalCategories,
    staleTime: 10 * 60 * 1000, // 10분간 캐시
  })

  // 카테고리 ID로 카테고리 찾기
  const findCategoryById = useCallback((cats: CategoryNode[], id: string): CategoryNode | null => {
    for (const cat of cats) {
      if (cat.id.toString() === id) return cat
      if (cat.children) {
        const found = findCategoryById(cat.children, id)
        if (found) return found
      }
    }
    return null
  }, [])

  // 초기 카테고리 설정
  useEffect(() => {
    if (categoryData?.level1 && initialCategoryId && !selectedCategory1) {
      const foundCategory = findCategoryById(categoryData.level1, initialCategoryId)
      if (foundCategory) {
        // 카테고리 레벨에 따라 상태 설정
        if (foundCategory.level === 1) {
          setSelectedCategory1(foundCategory)
          onCategoryChange(foundCategory.id.toString(), foundCategory.name)
        }
        // TODO: 2~4차 카테고리 지원 (복잡하므로 필요시 추가)
      }
    }
  }, [categoryData, initialCategoryId, selectedCategory1, findCategoryById, onCategoryChange])

  // 카테고리 변경 핸들러들
  const handleCategory1Change = (categoryId: string) => {
    if (showAllOption && categoryId === 'all') {
      setSelectedCategory1(null)
      setSelectedCategory2(null)
      setSelectedCategory3(null)
      setSelectedCategory4(null)
      onCategoryChange(null, '전체')
    } else {
      const category = categoryData?.level1.find(c => c.id.toString() === categoryId)
      if (category) {
        setSelectedCategory1(category)
        setSelectedCategory2(null)
        setSelectedCategory3(null)
        setSelectedCategory4(null)
        onCategoryChange(categoryId, category.name)
      }
    }
  }

  const handleCategory2Change = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategory2(null)
      setSelectedCategory3(null)
      setSelectedCategory4(null)
      onCategoryChange(selectedCategory1?.id.toString() || null, selectedCategory1?.name || '전체')
    } else {
      const category = selectedCategory1?.children?.find(c => c.id.toString() === categoryId)
      if (category) {
        setSelectedCategory2(category)
        setSelectedCategory3(null)
        setSelectedCategory4(null)
        onCategoryChange(categoryId, category.name)
      }
    }
  }

  const handleCategory3Change = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategory3(null)
      setSelectedCategory4(null)
      onCategoryChange(selectedCategory2?.id.toString() || null, selectedCategory2?.name || '전체')
    } else {
      const category = selectedCategory2?.children?.find(c => c.id.toString() === categoryId)
      if (category) {
        setSelectedCategory3(category)
        setSelectedCategory4(null)
        onCategoryChange(categoryId, category.name)
      }
    }
  }

  const handleCategory4Change = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategory4(null)
      onCategoryChange(selectedCategory3?.id.toString() || null, selectedCategory3?.name || '전체')
    } else {
      const category = selectedCategory3?.children?.find(c => c.id.toString() === categoryId)
      if (category) {
        setSelectedCategory4(category)
        onCategoryChange(categoryId, category.name)
      }
    }
  }

  if (isLoadingCategories) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400"></div>
        <span className="ml-2 text-sm text-gray-400">카테고리 로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* 1차 카테고리 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-200">1차:</span>
        <Select
          value={selectedCategory1?.id.toString() || (showAllOption ? 'all' : '')}
          onValueChange={handleCategory1Change}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={showAllOption ? '전체' : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {showAllOption && <SelectItem value="all">전체</SelectItem>}
            {categoryData?.level1
              .filter(category => category.name !== '전체') // 실제 카테고리 중 "전체" 제외
              .map(category => (
                <SelectItem key={category.id.toString()} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2차 카테고리 */}
      {maxLevel >= 2 && selectedCategory1 && selectedCategory1.children && selectedCategory1.children.length > 0 && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-200">2차:</span>
            <Select value={selectedCategory2?.id.toString() || 'all'} onValueChange={handleCategory2Change}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">카테고리 선택</SelectItem>
                {selectedCategory1.children.map(category => (
                  <SelectItem key={category.id.toString()} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* 3차 카테고리 */}
      {maxLevel >= 3 && selectedCategory2 && selectedCategory2.children && selectedCategory2.children.length > 0 && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-200">3차:</span>
            <Select value={selectedCategory3?.id.toString() || 'all'} onValueChange={handleCategory3Change}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">카테고리 선택</SelectItem>
                {selectedCategory2.children.map(category => (
                  <SelectItem key={category.id.toString()} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* 4차 카테고리 */}
      {maxLevel >= 4 && selectedCategory3 && selectedCategory3.children && selectedCategory3.children.length > 0 && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-200">4차:</span>
            <Select value={selectedCategory4?.id.toString() || 'all'} onValueChange={handleCategory4Change}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">카테고리 선택</SelectItem>
                {selectedCategory3.children.map(category => (
                  <SelectItem key={category.id.toString()} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  )
}
