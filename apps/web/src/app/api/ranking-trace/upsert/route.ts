import { NextRequest, NextResponse } from 'next/server'
import { upsertTrackedProduct } from '../../../(service)/(default)/analyze/ranking-trace/trackedProductUpdateAction'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productData } = body

    if (!userId || !productData) {
      return NextResponse.json({ error: 'userId와 productData가 필요합니다.' }, { status: 400 })
    }

    const result = await upsertTrackedProduct(userId, productData)

    if (result.status === 'success') {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('랭킹 추적 상품 업서트 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
