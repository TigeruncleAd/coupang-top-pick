import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@repo/database'
import { upsertTrackedProduct } from '../../(service)/(default)/analyze/ranking-trace/trackedProductUpdateAction'

export async function POST(request: NextRequest) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  try {
    console.log('🚀 rankingsearch API 시작')

    const body = await request.json()
    console.log('📦 요청 body:', JSON.stringify(body, null, 2))

    const {
      // 상품 기본 정보
      productName,
      productUrl,
      market,
      storeName,
      productImage,

      // 상품 상세 정보
      price,
      originalPrice,
      discountRate,
      rating,
      reviewCount,

      // 추가 정보
      brandName,
      productType,
      shippingCost,
      productNumber,
      brand,
      model,
      origin,

      // 메타 정보
      isActive,
      extractedAt,
      source,

      // 요청 메타 정보
      timestamp,
      url,
      userAgent,
      isDev,

      // 경쟁 상품 관련 정보
      isCompetitor,
      competitorFor,
    } = body

    console.log('📊 rankingsearch API 호출:', { url, timestamp })
    console.log('🔍 경쟁 상품 파라미터 확인:', { isCompetitor, competitorFor, productName })

    // JWT 토큰에서 userId 가져오기
    const header = request.headers
    const authorization = header.get('Authorization')
    console.log('🔑 Authorization 헤더:', authorization)

    if (!authorization) {
      console.log('❌ Authorization 헤더가 없습니다')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.split(' ')[1]
    console.log('🎫 추출된 토큰:', token ? '있음' : '없음')

    if (!token) {
      console.log('❌ 토큰이 없습니다')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔐 JWT 검증 시작')
    const decoded = jwt.verify(token, process.env.EXT_TOKEN_SECRET!) as any
    console.log('🔐 JWT 디코딩 결과:', decoded)

    if (!decoded) {
      console.log('❌ JWT 검증 실패')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const userId = decoded.userId
    console.log('🔧 JWT에서 가져온 userId:', userId)

    if (!productUrl) {
      return NextResponse.json({ error: 'productUrl이 필요합니다.' }, { status: 400 })
    }

    // URL에서 기본 정보 추출
    let urlObj: URL
    try {
      const decodedUrl = decodeURIComponent(productUrl)
      urlObj = new URL(decodedUrl)
    } catch (error) {
      console.error('URL 파싱 오류:', error, 'URL:', productUrl)
      return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 })
    }

    const isNaver = urlObj.hostname.includes('naver.com')
    const isCoupang = urlObj.hostname.includes('coupang.com')

    console.log('🔍 URL 분석:', { hostname: urlObj.hostname, isNaver, isCoupang })

    // ExtensionProductData 형식으로 변환
    const extensionProductData = {
      name: productName || '상품명 없음',
      url: productUrl,
      market:
        (market as 'naver' | 'coupang') ||
        (isNaver ? ('naver' as const) : isCoupang ? ('coupang' as const) : ('naver' as const)),
      storeName: storeName || '스토어명 없음',
      productImage: productImage,
      price: price ? parseInt(price.toString()) : undefined,
      originalPrice: originalPrice ? parseInt(originalPrice.toString()) : undefined,
      discountRate: discountRate ? parseFloat(discountRate.toString()) : undefined,
      rating: rating ? parseFloat(rating.toString()) : undefined,
      reviewCount: reviewCount ? parseInt(reviewCount.toString()) : undefined,
      isActive: isActive !== undefined ? isActive : true,
      keywords: [], // 빈 배열
      rankings: [], // 빈 배열
      // 분리된 데이터 필드들
      historyData: {
        reviewHistory: [],
        priceHistory: [],
        ratingHistory: [],
        salesHistory: [],
      },
      metadata: {
        categories: [],
        tags: [],
        brand: brand || brandName,
        brandName,
        productGroups: [],
        // 추가 상품 정보
        productType,
        shippingCost,
        productNumber,
        model,
        origin,
        // 메타 정보
        extractedAt,
        source,
        // 요청 메타 정보
        timestamp,
        url,
        userAgent,
        isDev,
        searchType: 'ranking',
      },
      competitorData: {
        competitors: [],
        competitorTracking: [],
      },
    }

    console.log('💾 TrackedProduct 저장 시도:', {
      userId,
      market: extensionProductData.market,
      name: extensionProductData.name,
      url: extensionProductData.url,
      miscKeys: Object.keys(extensionProductData.competitorData || {}),
    })

    // 경쟁 상품인 경우 처리
    if (isCompetitor && competitorFor) {
      console.log('🏆 경쟁 상품 데이터 처리 시작:', { competitorFor, productName })

      try {
        // 1. 경쟁 상품 TrackedProduct 찾기 또는 생성
        let competitorProduct = await prisma.trackedProduct.findFirst({
          where: {
            url: productUrl,
          },
        })

        if (!competitorProduct) {
          // 경쟁 상품 TrackedProduct 생성
          competitorProduct = await prisma.trackedProduct.create({
            data: {
              name: productName || '상품명 없음',
              url: productUrl,
              market: extensionProductData.market,
              storeName: storeName || '스토어명 없음',
              productImage: productImage,
              price: price ? parseInt(price.toString()) : 0,
              originalPrice: originalPrice ? parseInt(originalPrice.toString()) : 0,
              discountRate: discountRate ? parseFloat(discountRate.toString()) : 0,
              rating: rating ? parseFloat(rating.toString()) : 0,
              reviewCount: reviewCount ? parseInt(reviewCount.toString()) : 0,
              isActive: true,
              historyData: {},
              metadata: {
                brand: brand || brandName,
                productType,
                shippingCost,
                productNumber,
                model,
                origin,
                extractedAt,
                source,
                timestamp,
                url,
                userAgent,
                isDev,
                searchType: 'ranking',
              },
            },
          })
        }

        // 2. 메인 상품의 UserTrackedProduct 찾기
        const mainUserTrackedProduct = await prisma.userTrackedProduct.findFirst({
          where: {
            productId: BigInt(competitorFor),
            userId: BigInt(userId),
          },
        })

        if (!mainUserTrackedProduct) {
          console.error('❌ 대상 상품을 찾을 수 없습니다:', competitorFor)
          return NextResponse.json({ error: '대상 상품을 찾을 수 없습니다.' }, { status: 404, headers })
        }

        // 3. UserCompetitor 생성 또는 업데이트
        await prisma.userCompetitor.upsert({
          where: {
            mainProductId_competitorProductId: {
              mainProductId: mainUserTrackedProduct.id,
              competitorProductId: competitorProduct.id,
            },
          },
          update: {
            trackingData: {
              addedAt: new Date().toISOString().split('T')[0],
              initialData: {
                name: productName || '상품명 없음',
                url: productUrl,
                market: extensionProductData.market,
                storeName: storeName || '스토어명 없음',
                productImage: productImage,
                price: price ? parseInt(price.toString()) : 0,
                originalPrice: originalPrice ? parseInt(originalPrice.toString()) : 0,
                discountRate: discountRate ? parseFloat(discountRate.toString()) : 0,
                rating: rating ? parseFloat(rating.toString()) : 0,
                reviewCount: reviewCount ? parseInt(reviewCount.toString()) : 0,
                brand: brand || brandName,
              },
            },
          },
          create: {
            mainProductId: mainUserTrackedProduct.id,
            competitorProductId: competitorProduct.id,
            trackingData: {
              addedAt: new Date().toISOString().split('T')[0],
              initialData: {
                name: productName || '상품명 없음',
                url: productUrl,
                market: extensionProductData.market,
                storeName: storeName || '스토어명 없음',
                productImage: productImage,
                price: price ? parseInt(price.toString()) : 0,
                originalPrice: originalPrice ? parseInt(originalPrice.toString()) : 0,
                discountRate: discountRate ? parseFloat(discountRate.toString()) : 0,
                rating: rating ? parseFloat(rating.toString()) : 0,
                reviewCount: reviewCount ? parseInt(reviewCount.toString()) : 0,
                brand: brand || brandName,
              },
            },
          },
        })

        console.log('✅ 경쟁 상품 UserCompetitor 생성 완료:', {
          competitorFor,
          competitorProductId: competitorProduct.id.toString(),
          mainUserTrackedProductId: mainUserTrackedProduct.id.toString(),
        })

        return NextResponse.json(
          {
            success: true,
            productId: competitorFor,
            message: '경쟁 상품이 성공적으로 추가되었습니다.',
          },
          { status: 200, headers },
        )
      } catch (error) {
        console.error('❌ 경쟁 상품 처리 오류:', error)
        return NextResponse.json({ error: '경쟁 상품 처리 중 오류가 발생했습니다.' }, { status: 500, headers })
      }
    }

    // 일반 상품인 경우 기존 로직 실행
    console.log('🔧 upsertTrackedProduct 호출 시작')
    const result = await upsertTrackedProduct(userId, extensionProductData)
    console.log('🔧 upsertTrackedProduct 호출 완료')

    console.log('💾 TrackedProduct 저장 결과:', result)

    if (result.status === 'success') {
      return NextResponse.json(
        {
          ...result,
          productId: result.result?.productId, // 확장 프로그램에서 사용할 productId 추가
          message: '랭킹 검색 데이터가 성공적으로 저장되었습니다.',
          searchType: 'ranking',
        },
        { headers },
      )
    } else {
      console.error('❌ TrackedProduct 저장 실패:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500, headers })
    }
  } catch (error) {
    console.error('❌ rankingsearch API 오류:', error)
    console.error('❌ 오류 스택:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers },
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
