'use client'

import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { useState, useEffect } from 'react'
import { getMainCategories } from '@/serverActions/analyze/category.actions'

interface Category {
  id: bigint
  name: string
  fullName: string
}

interface CategoryTabsProps {
  onCategoryChange: (categoryId: string | null, categoryName: string) => void
  selectedCategoryName?: string
}

export default function CategoryTabs({ onCategoryChange, selectedCategoryName = '전체' }: CategoryTabsProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const mainCategories = await getMainCategories()
        setCategories(mainCategories)
      } catch (error) {
        console.error('카테고리 로딩 실패:', error)
        // 기본 카테고리로 fallback
        setCategories([
          { id: BigInt(0), name: '전체', fullName: '전체' },
          { id: BigInt(1), name: '패션의류', fullName: '패션의류' },
          { id: BigInt(2), name: '패션잡화', fullName: '패션잡화' },
          { id: BigInt(3), name: '화장품/미용', fullName: '화장품/미용' },
          { id: BigInt(4), name: '디지털/가전', fullName: '디지털/가전' },
          { id: BigInt(5), name: '가구/인테리어', fullName: '가구/인테리어' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryChange = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    if (category) {
      const categoryId = category.id.toString() === '0' ? null : category.id.toString()
      onCategoryChange(categoryId, categoryName)
    }
  }

  // 비활성화할 카테고리 목록
  const disabledCategories = ['도서', '여가/생활편의']

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-200">카테고리:</span>
        <div className="h-10 w-48 animate-pulse rounded bg-gray-700"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-200">카테고리:</span>
      <Tabs value={selectedCategoryName} onValueChange={handleCategoryChange}>
        <TabsList className="bg-gray-700">
          {categories
            .filter(category => !disabledCategories.includes(category.name))
            .map(category => (
              <TabsTrigger
                key={category.id.toString()}
                value={category.name}
                className="data-[state=active]:bg-gray-600">
                {category.name}
              </TabsTrigger>
            ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
