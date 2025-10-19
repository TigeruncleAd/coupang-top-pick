'use client'
import { Category } from '@repo/database'
import { useEffect, useState } from 'react'

export default function CategorySelector({
  categories,
  currentCategoryId,
  onSelectCategory,
}: {
  categories: Category[]
  currentCategoryId: string
  onSelectCategory: (category: Category) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    categories.find(category => category.smartStoreId === currentCategoryId),
  )
  const [isOpen, setIsOpen] = useState(false)
  const [totalCategories, settotalCategories] = useState<Category[]>([])

  const firstCategories = categories.filter(category => category.parentId === null)

  function findChildrenCategories(category: Category) {
    return categories.filter(c => c.parentId === category?.id)
  }
  function findParentCategory(category: Category) {
    return categories.find(c => c.id === category?.parentId)
  }

  function resetCategory() {
    setSelectedCategory(categories.find(category => category.smartStoreId === currentCategoryId))
  }

  function getCategoryName(category: Category) {
    return category.smartStoreName.split('>').pop()
  }

  const childrenCategories = findChildrenCategories(selectedCategory)

  useEffect(() => {
    if (!selectedCategory) return
    let parentCategory = findParentCategory(selectedCategory)

    let newTotalCategories = [selectedCategory]
    while (parentCategory) {
      newTotalCategories = [parentCategory, ...newTotalCategories]
      parentCategory = findParentCategory(parentCategory)
    }
    settotalCategories(newTotalCategories)
  }, [selectedCategory])

  return (
    <div className="flex shrink-0 items-center rounded-md border p-2">
      <div className="flex items-center gap-2 text-sm">
        <div className="font-semibold">카테고리 : </div>
        {selectedCategory?.smartStoreName || '선택된 카테고리가 없습니다.'}
        {isOpen ? (
          <div className="ml-4 flex items-center gap-2">
            <button
              className="cursor-pointer rounded-md text-blue-500 underline"
              onClick={() => {
                resetCategory()
                setIsOpen(false)
              }}>
              취소
            </button>
            <button className="cursor-pointer rounded-md text-blue-500 underline" onClick={() => resetCategory()}>
              초기화
            </button>
            <button
              className="cursor-pointer rounded-md text-blue-500 underline"
              onClick={() => {
                onSelectCategory(selectedCategory)
                setIsOpen(false)
              }}>
              적용
            </button>
          </div>
        ) : (
          <button className="ml-4 cursor-pointer rounded-md text-blue-500 underline" onClick={() => setIsOpen(true)}>
            카테고리 변경
          </button>
        )}
      </div>
      {isOpen && (
        <div className="mt-2 flex w-full gap-2 bg-white text-sm">
          <div>
            <select
              className="rounded-md border border-gray-300 text-sm"
              onChange={e => {
                const category = categories.find(category => category.smartStoreId === e.target.value)
                if (category) {
                  setSelectedCategory(category)
                }
              }}
              value={totalCategories[0]?.smartStoreId}>
              {firstCategories.map(category => (
                <option key={category.smartStoreId} value={category.smartStoreId}>
                  {category.smartStoreName}
                </option>
              ))}
            </select>
          </div>
          {totalCategories.length > 1 && (
            <div className="flex gap-2">
              {totalCategories.map((category, idx) => {
                if (idx === 0) return null
                const childrens = findChildrenCategories(totalCategories[idx - 1])
                return (
                  <div key={category.smartStoreId}>
                    <select
                      className="rounded-md border border-gray-300 text-sm"
                      onChange={e => {
                        const category = childrens.find(category => category.smartStoreId === e.target.value)
                        if (category) {
                          setSelectedCategory(category)
                        }
                      }}
                      value={category.smartStoreId}>
                      {childrens.map((child, idx) => {
                        return (
                          <option key={child.smartStoreId} value={child.smartStoreId}>
                            {getCategoryName(child)}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )
              })}
            </div>
          )}
          {selectedCategory && childrenCategories.length > 0 && (
            <select
              className="rounded-md border border-gray-300 text-sm"
              onChange={e => {
                const category = childrenCategories.find(category => category.smartStoreId === e.target.value)
                if (category) {
                  setSelectedCategory(category)
                }
              }}
              value={selectedCategory?.smartStoreId}>
              <option value={undefined}>선택</option>
              {childrenCategories.map(category => (
                <option key={category.smartStoreId} value={category.smartStoreId}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
