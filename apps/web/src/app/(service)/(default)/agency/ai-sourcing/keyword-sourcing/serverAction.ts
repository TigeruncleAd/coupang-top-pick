'use server'
import { kdayjs, successServerAction, throwServerAction } from '@repo/utils'
import { getServerUser } from '../../../../../../../lib/utils/server/getServerUser'
import { prisma } from '@repo/database'
import { encryptTextWithAesGcm } from '@/lib/utils/crypto'
const ENCRYPT_KEY = process.env.NEXT_PUBLIC_KOIKOI!

export async function getSearchMall({ date }: { date?: string }) {
  const user = await getServerUser()

  const listData = await prisma.searchedMall.findMany({
    where: {
      date: date,
      userId: user.id,
    },
    orderBy: {
      id: 'asc',
    },
    select: {
      keyword: true,
      status: true,
    },
  })
  const uniqueKeywords = [...new Set(listData.map(item => item.keyword))]
  const result = uniqueKeywords.map(keyword => {
    return {
      keyword,
      totalCount: listData.filter(item => item.keyword === keyword).length,
      crawledCount: listData.filter(item => item.keyword === keyword && item.status === 'CRAWLED').length,
    }
  })

  return { listData: result }
}

export async function getSearchMallByKeyword({ keyword, date }: { keyword: string; date: string }) {
  const user = await getServerUser()
  const listData = await prisma.searchedMall.findMany({
    where: {
      keyword: keyword,
      date: date,
      userId: user.id,
    },
    select: {
      id: true,
      status: true,
      mallPcUrl: true,
    },
    orderBy: {
      id: 'asc',
    },
  })
  let i = 0
  let targetData = listData[i]
  let s = 's'
  while (i <= listData.length) {
    targetData = listData[i]
    if (targetData?.status === 'PENDING') {
      break
    }
    if (targetData?.status === 'FAILED') {
      s = 'f'
      break
    }
    if (!targetData) {
      targetData = null
      break
    }
    i++
  }
  // encrypt with AES-256-GCM and base64 so client can decrypt
  const encryptedMallPCurl = targetData ? encryptTextWithAesGcm(targetData?.mallPcUrl || '', ENCRYPT_KEY) : ''

  return {
    t: listData.length,
    c: listData.filter(item => item.status === 'CRAWLED').length,
    n: encryptedMallPCurl,
    i: targetData?.id?.toString(),
    k: i,
    s: s,
  }
}

export async function deleteSearchedMalls({ keywords, date }: { keywords: string[]; date: string }) {
  try {
    const user = await getServerUser()
    await prisma.searchedMall.deleteMany({
      where: {
        keyword: {
          in: keywords,
        },
        date: date,
        userId: user.id,
      },
    })
    return successServerAction('삭제에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('삭제에 실패했습니다.')
  }
}

export async function completeSearchMall({ mallUrl }: { mallUrl: string }) {
  try {
    const user = await getServerUser()
    const targetMalls = await prisma.searchedMall.findMany({
      where: {
        userId: user.id,
        mallPcUrl: {
          startsWith: mallUrl,
        },
      },
    })
    if (!targetMalls.length) {
      return throwServerAction('해당 URL을 가진 쇼핑몰이 없습니다.')
    }
    const updated = await prisma.searchedMall.updateMany({
      where: {
        id: {
          in: targetMalls.map(m => m.id),
        },
      },
      data: {
        status: 'CRAWLED',
        isComplete: true,
      },
    })
  } catch (e) {
    console.error(e)
    return throwServerAction('완료에 실패했습니다.')
  }
}

export async function updateBanWords({ banWords }: { banWords: string[] }) {
  try {
    const user = await getServerUser()

    // banWords 레코드가 있는지 확인
    const existingBanWords = await prisma.banwords.findUnique({
      where: {
        userId: user.id,
      },
    })

    if (existingBanWords) {
      // 기존 레코드 업데이트
      await prisma.banwords.update({
        where: {
          userId: user.id,
        },
        data: {
          banWords,
        },
      })
    } else {
      // 새 레코드 생성
      await prisma.banwords.create({
        data: {
          userId: user.id,
          banWords,
        },
      })
    }

    return successServerAction('금지어 업데이트에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('금지어 업데이트에 실패했습니다.')
  }
}
