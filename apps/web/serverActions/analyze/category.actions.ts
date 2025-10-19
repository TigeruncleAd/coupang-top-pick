'use server'

import { prisma } from '@repo/database'

/**
 * 실제 데이터베이스에서 카테고리 목록 조회
 */
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        fullName: true,
        smartStoreId: true,
        parentId: true,
        order: true,
        level: true,
      },
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    })

    return categories
  } catch (error) {
    console.error('카테고리 조회 중 오류:', error)
    return []
  }
}

/**
 * 1차 카테고리만 조회 (트렌드 분석용)
 */
export async function getMainCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        level: 1,
      },
      select: {
        id: true,
        name: true,
        fullName: true,
      },
      orderBy: { order: 'asc' },
    })

    // '전체' 카테고리를 맨 앞에 추가
    return [{ id: BigInt(0), name: '전체', fullName: '전체' }, ...categories]
  } catch (error) {
    console.error('1차 카테고리 조회 중 오류:', error)
    // 오류 시 기본 카테고리 반환
    return [
      { id: BigInt(0), name: '전체', fullName: '전체' },
      { id: BigInt(1), name: '패션의류', fullName: '패션의류' },
      { id: BigInt(2), name: '패션잡화', fullName: '패션잡화' },
      { id: BigInt(3), name: '화장품/미용', fullName: '화장품/미용' },
      { id: BigInt(4), name: '디지털/가전', fullName: '디지털/가전' },
      { id: BigInt(5), name: '가구/인테리어', fullName: '가구/인테리어' },
    ]
  }
}

/**
 * 카테고리명 목록만 반환 (기존 코드 호환성을 위해)
 */
export async function getCategoryNames(): Promise<string[]> {
  try {
    const categories = await getMainCategories()
    return categories.map(cat => cat.name)
  } catch (error) {
    console.error('카테고리명 조회 중 오류:', error)
    return ['전체', '패션의류', '패션잡화', '화장품/미용', '디지털/가전', '가구/인테리어']
  }
}

/**
 * 계층적 카테고리 구조 조회 (1차 -> 2차 -> 3차 -> 4차)
 */
export async function getHierarchicalCategories() {
  try {
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        fullName: true,
        smartStoreId: true,
        parentId: true,
        level: true,
        order: true,
      },
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    })

    // 레벨별 카테고리 분류
    const level1Categories = allCategories.filter(cat => cat.level === 1)
    const level2Categories = allCategories.filter(cat => cat.level === 2)
    const level3Categories = allCategories.filter(cat => cat.level === 3)
    const level4Categories = allCategories.filter(cat => cat.level === 4)

    // 4차 계층 구조로 조합
    const hierarchicalCategories = level1Categories.map(level1 => ({
      ...level1,
      children: level2Categories
        .filter(level2 => level2.parentId === level1.id)
        .map(level2 => ({
          ...level2,
          children: level3Categories
            .filter(level3 => level3.parentId === level2.id)
            .map(level3 => ({
              ...level3,
              children: level4Categories.filter(level4 => level4.parentId === level3.id),
            })),
        })),
    }))

    return {
      level1: [{ id: BigInt(0), name: '전체', fullName: '전체', level: 0, children: [] }, ...hierarchicalCategories],
      level2: level2Categories,
      level3: level3Categories,
      level4: level4Categories,
      all: allCategories,
    }
  } catch (error) {
    console.error('계층적 카테고리 조회 중 오류:', error)
    return {
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      all: [],
    }
  }
}

/**
 * 특정 카테고리의 하위 카테고리 조회
 */
export async function getChildCategories(parentId: bigint) {
  try {
    const children = await prisma.category.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        fullName: true,
        smartStoreId: true,
        parentId: true,
        level: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    })

    return children
  } catch (error) {
    console.error('하위 카테고리 조회 중 오류:', error)
    return []
  }
}
