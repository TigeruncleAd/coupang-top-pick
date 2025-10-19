const { PrismaClient } = require('./generated/client')

const prisma = new PrismaClient()

async function migrateToNormalizedSchema() {
  console.log('🔄 정규화된 스키마로 마이그레이션 시작...')

  try {
    // 1. 기존 TrackedProduct 데이터 조회
    const trackedProducts = await prisma.trackedProduct.findMany({
      include: {
        keywords: true,
        rankings: true,
        changes: true,
      },
    })

    console.log(`📦 ${trackedProducts.length}개의 TrackedProduct를 마이그레이션합니다.`)

    for (const trackedProduct of trackedProducts) {
      console.log(`🔄 상품 마이그레이션 중: ${trackedProduct.name}`)

      // 1. MarketProduct 생성 또는 찾기
      let marketProduct = await prisma.marketProduct.findFirst({
        where: { url: trackedProduct.url },
      })

      if (!marketProduct) {
        marketProduct = await prisma.marketProduct.create({
          data: {
            name: trackedProduct.name,
            url: trackedProduct.url,
            market: trackedProduct.market,
            storeName: trackedProduct.storeName,
            productImage: trackedProduct.productImage,
            price: trackedProduct.price,
            originalPrice: trackedProduct.originalPrice,
            discountRate: trackedProduct.discountRate,
            rating: trackedProduct.rating,
            reviewCount: trackedProduct.reviewCount,
            isActive: trackedProduct.isActive,
            historyData: trackedProduct.historyData,
            metadata: trackedProduct.metadata,
            groupId: trackedProduct.groupId,
          },
        })
        console.log(`✅ MarketProduct 생성: ${marketProduct.id}`)
      } else {
        console.log(`📋 기존 MarketProduct 사용: ${marketProduct.id}`)
      }

      // 2. UserTrackedProduct 생성
      const userTrackedProduct = await prisma.userTrackedProduct.create({
        data: {
          userId: trackedProduct.userId,
          productId: marketProduct.id,
          isActive: trackedProduct.isActive,
          customName: null,
        },
      })
      console.log(`✅ UserTrackedProduct 생성: ${userTrackedProduct.id}`)

      // 3. TrackedKeyword 마이그레이션
      for (const keyword of trackedProduct.keywords) {
        await prisma.trackedKeyword.update({
          where: { id: keyword.id },
          data: {
            userTrackedProductId: userTrackedProduct.id,
          },
        })
      }
      console.log(`✅ ${trackedProduct.keywords.length}개 키워드 마이그레이션 완료`)

      // 4. ProductRanking 마이그레이션
      for (const ranking of trackedProduct.rankings) {
        await prisma.productRanking.update({
          where: { id: ranking.id },
          data: {
            marketProductId: marketProduct.id,
          },
        })
      }
      console.log(`✅ ${trackedProduct.rankings.length}개 랭킹 데이터 마이그레이션 완료`)

      // 5. ProductChange 마이그레이션
      for (const change of trackedProduct.changes) {
        await prisma.productChange.update({
          where: { id: change.id },
          data: {
            marketProductId: marketProduct.id,
          },
        })
      }
      console.log(`✅ ${trackedProduct.changes.length}개 변화 데이터 마이그레이션 완료`)

      // 6. 경쟁 상품 데이터 마이그레이션
      if (trackedProduct.competitorData?.competitors) {
        for (const competitor of trackedProduct.competitorData.competitors) {
          // 경쟁 상품 MarketProduct 생성 또는 찾기
          let competitorProduct = await prisma.marketProduct.findFirst({
            where: { url: competitor.url },
          })

          if (!competitorProduct) {
            competitorProduct = await prisma.marketProduct.create({
              data: {
                name: competitor.name,
                url: competitor.url,
                market: competitor.market || 'naver',
                storeName: competitor.storeName,
                productImage: competitor.productImage,
                price: competitor.price,
                originalPrice: competitor.originalPrice,
                discountRate: competitor.discountRate,
                rating: competitor.rating,
                reviewCount: competitor.reviewCount,
                isActive: true,
                historyData: {},
                metadata: {},
              },
            })
          }

          // UserCompetitor 생성
          await prisma.userCompetitor.create({
            data: {
              mainProductId: userTrackedProduct.id,
              competitorProductId: competitorProduct.id,
              trackingData: {
                addedAt: competitor.addedAt,
                initialData: competitor,
              },
            },
          })
        }
        console.log(`✅ ${trackedProduct.competitorData.competitors.length}개 경쟁 상품 마이그레이션 완료`)
      }
    }

    console.log('🎉 모든 데이터 마이그레이션 완료!')
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateToNormalizedSchema()
