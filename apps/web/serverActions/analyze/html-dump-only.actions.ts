'use server'

import { getHTMLDumper, DumpResult } from '@/lib/analyze/html-dumper'
import { prisma } from '@repo/database'

/**
 * 카테고리명으로 DB에서 smartStoreId 조회
 */
async function getSmartStoreIdFromCategoryName(categoryName: string): Promise<string> {
  try {
    const category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
      select: {
        smartStoreId: true,
      },
    })

    if (category && category.smartStoreId) {
      console.log(`📋 카테고리 "${categoryName}"의 smartStoreId: ${category.smartStoreId}`)
      return category.smartStoreId
    }

    console.log(`⚠️ 카테고리 "${categoryName}"의 smartStoreId를 찾을 수 없음, 전체(A)로 설정`)
    return 'A'
  } catch (error) {
    console.error(`❌ 카테고리 "${categoryName}" 조회 실패:`, error)
    return 'A'
  }
}

/**
 * HTML 덤프만 수행 (DB 저장 없음)
 */
export async function dumpHTMLOnly(categoryId?: string, categoryName?: string): Promise<DumpResult> {
  const dumper = getHTMLDumper()

  try {
    await dumper.initialize()

    // 카테고리별 URL 생성
    let url: string
    let displayName: string

    if (!categoryName || categoryName === '전체') {
      url = 'https://snxbest.naver.com/keyword/best?categoryId=A&sortType=KEYWORD_POPULAR&periodType=DAILY&ageType=ALL'
      displayName = '전체'
    } else {
      // DB에서 카테고리명으로 smartStoreId 조회
      const smartStoreId = await getSmartStoreIdFromCategoryName(categoryName)
      url = `https://snxbest.naver.com/keyword/best?categoryId=${smartStoreId}&sortType=KEYWORD_POPULAR&periodType=DAILY&ageType=ALL`
      displayName = categoryName
    }

    console.log(`🎯 HTML 덤프 대상: ${displayName}`)
    console.log(`🔗 URL: ${url}`)

    const result = await dumper.dumpPage(url, displayName)
    return result
  } catch (error) {
    console.error('HTML 덤프 실패:', error)
    throw error
  } finally {
    await dumper.close()
  }
}
