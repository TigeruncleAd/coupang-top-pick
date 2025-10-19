import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@repo/database'
import { fetchNaverSearchAd } from '@/lib/utils/naverSearchAd'

export async function POST(request: NextRequest) {
  const header = request.headers
  const authorization = header.get('Authorization')
  if (!authorization) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const token = authorization.split(' ')[1]
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const decoded = jwt.verify(token, process.env.EXT_TOKEN_SECRET!) as any
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const userId = decoded.userId
  const user = await prisma.user.findUnique({
    where: {
      id: BigInt(userId),
    },
  })
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  console.log(user.id)
  const data = await request.json()
  const {
    query: decodedQuery,
    total,
    productInfos,
    nluTerms,
    categories,
    recommendTrendResponse,
    product10Prices,
    product40Prices,
    product80Prices,
    average10Price,
    average40Price,
    average80Price,
    queryValidate,
    recommendTrend,
    relatedQueries,
    relatedQueriesBottom,
    categoryId,
  } = data
  let userKeyword = await prisma.userKeyword.findFirst({
    where: {
      keyword: {
        keyword: decodedQuery,
      },
    },
    include: {
      keyword: true,
    },
  })
  let adInfoUpdatedAt = new Date(userKeyword?.keyword?.adInfoUpdatedAt || 0)
  let userInfoUpdatedAt = new Date(userKeyword?.updatedAt || 0)
  let datalabInfoUpdatedAt = new Date(userKeyword?.keyword?.datalabInfoUpdatedAt || 0)

  if (!!userKeyword && userInfoUpdatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
    console.log('user info update')
    await prisma.userKeyword.update({
      where: {
        id: userKeyword.id,
      },
      data: {
        updatedAt: new Date(),
        productInfos: productInfos,
        misc: {
          total,
          nluTerms,
          categories,
          recommendTrendResponse,
          product10Prices,
          product40Prices,
          product80Prices,
          average10Price,
          average40Price,
          average80Price,
          queryValidate,
          recommendTrend,
          relatedQueries,
          relatedQueriesBottom,
          categoryId,
        },
      },
    })
  }

  if (!userKeyword) {
    console.log('user keyword create')
    // 먼저 키워드를 찾거나 생성
    const keyword = await prisma.keyword.upsert({
      where: { keyword: decodedQuery },
      update: {},
      create: {
        keyword: decodedQuery,
        hashedKeyword: Buffer.from(decodedQuery).toString('base64'),
        category: { connect: { smartStoreId: categoryId } },
      },
    })

    await prisma.userKeyword.create({
      data: {
        userId: user.id,
        keywordId: keyword.id,
        source: 'search', // 검색으로 생성됨을 표시
        misc: {
          total,
          nluTerms,
          categories,
          recommendTrendResponse,
          product10Prices,
          product40Prices,
          product80Prices,
          average10Price,
          average40Price,
          average80Price,
          queryValidate,
          recommendTrend,
          relatedQueries,
          relatedQueriesBottom,
          categoryId,
        },
        productInfos: productInfos,
      },
    })

    // userKeyword를 다시 조회
    userKeyword = await prisma.userKeyword.findFirst({
      where: {
        keyword: {
          keyword: decodedQuery,
        },
        userId: user.id,
      },
      include: {
        keyword: true,
      },
    })
  }

  if (datalabInfoUpdatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
    console.log('datalab info update')
    await prisma.keyword.update({
      where: {
        keyword: decodedQuery,
      },
      data: {
        datalabInfoUpdatedAt: new Date(),
        misc: {
          total,
          nluTerms,
          categories,
          recommendTrendResponse,
          product10Prices,
          product40Prices,
          product80Prices,
          average10Price,
          average40Price,
          average80Price,
          queryValidate,
          recommendTrend,
          relatedQueries,
          relatedQueriesBottom,
          categoryId,
        },
      },
    })
  }
  // 24시간 이상 지났으면 업데이트
  if (adInfoUpdatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
    console.log('ad info update')
    const keywordSearchData = await fetchNaverSearchAd({
      method: 'GET',
      url: `/keywordstool`,
      searchParams: {
        hintKeywords: decodedQuery,
        showDetail: '1',
      },
    })
    const keywordList = keywordSearchData?.keywordList || []
    const targetKeyword = keywordList[0] || {}
    const {
      monthlyPcQcCnt, // 30일간 PC 검색 수
      monthlyMobileQcCnt, // 30일간 모바일 검색 수
      monthlyAvePcClkCnt, // 30일간 PC 클릭 수
      monthlyAveMobileClkCnt, // 30일간 모바일 클릭 수
      monthlyAvePcCtr, // 30일간 PC 클릭률
      monthlyAveMobileCtr, // 30일간 모바일 클릭률
      plAvgDepth, // 30일간 평균 깊이 ???
      compIdx, // 검색 경쟁도 '낮음
    } = targetKeyword

    const keywordSearchData2 = await fetchNaverSearchAd({
      method: 'POST',
      url: `/estimate/exposure-minimum-bid/keyword`,
      body: {
        device: 'MOBILE',
        items: [decodedQuery],
        period: 'DAY',
      },
    })
    const mobileExposureMinimumBid = keywordSearchData2?.estimate?.[0]?.bid || 0

    const keywordSearchData3 = await fetchNaverSearchAd({
      method: 'POST',
      url: `/estimate/exposure-minimum-bid/keyword`,
      body: {
        device: 'PC',
        items: [decodedQuery],
        period: 'DAY',
      },
    })
    const pcExposureMinimumBid = keywordSearchData3?.estimate?.[0]?.bid || 0
    const averageExposureMinimumBid = (pcExposureMinimumBid + mobileExposureMinimumBid) / 2
    await prisma.keyword.update({
      where: {
        keyword: decodedQuery,
      },
      data: {
        adInfoUpdatedAt: new Date(),
        adMisc: {
          monthlyPcQcCnt,
          monthlyMobileQcCnt,
          monthlyAvePcClkCnt,
          monthlyAveMobileClkCnt,
          monthlyAvePcCtr,
          monthlyAveMobileCtr,
          plAvgDepth,
          compIdx,
          pcExposureMinimumBid,
          mobileExposureMinimumBid,
          averageExposureMinimumBid,
        },
      },
    })
  }
  return NextResponse.json({ message: 'Hello, world!' })
}
