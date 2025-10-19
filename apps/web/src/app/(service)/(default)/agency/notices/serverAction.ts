'use server'
import { prisma } from '@repo/database'
import { successServerAction, throwServerAction } from '@repo/utils'

export async function getNotices({
  type,
  page = 1,
  limit = 20,
}: {
  type?: 'NORMAL' | 'URGENT' | 'ALL'
  page?: number
  limit?: number
}) {
  try {
    const skip = (page - 1) * limit

    const where = {
      serviceType: 'SHIPPING_AGENCY' as any, // SHIPPING_AGENCY 타입만 조회
      ...(type && type !== 'ALL' ? { type } : {}),
    }

    const [notices, totalCount] = await Promise.all([
      prisma.notice.findMany({
        where,
        orderBy: [
          { type: 'desc' }, // URGENT가 먼저 오도록
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.notice.count({ where }),
    ])

    return successServerAction('공지를 불러왔습니다.', {
      notices,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (e) {
    console.error('Notice fetch error:', e)
    return throwServerAction('공지 목록을 불러오는데 실패했습니다.')
  }
}

export async function getNoticeById({ id }: { id: string }) {
  try {
    const notice = await prisma.notice.findUnique({
      where: {
        id: BigInt(id),
      },
    })

    if (!notice) {
      return throwServerAction('공지를 찾을 수 없습니다.')
    }

    return successServerAction('공지를 불러왔습니다.', { notice })
  } catch (e) {
    console.error('Notice fetch error:', e)
    return throwServerAction('공지를 불러오는데 실패했습니다.')
  }
}
