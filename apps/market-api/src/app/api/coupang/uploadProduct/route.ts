import { NextResponse } from 'next/server'
import { getUserFromUserToken } from '../../../../../server/utils/getUserFromUserToken'
import { createProductCoupang } from '../functions/product'
import { prisma } from '@repo/database'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { userToken, productId } = data
    const user = await getUserFromUserToken(userToken)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 })
    }
    if (!user.marketSetting) {
      return NextResponse.json({ message: '마켓 설정을 먼저 진행 해 주세요.' }, { status: 400 })
    }
    if (!user.marketSetting.coupangMarketId) {
      return NextResponse.json({ message: '쿠팡 아이디 설정이 없습니다.' }, { status: 400 })
    }
    if (!user.marketSetting.coupangMarketName) {
      return NextResponse.json({ message: '쿠팡 마켓 이름 설정이 없습니다.' }, { status: 400 })
    }
    if (!user.marketSetting.coupangVendorId) {
      return NextResponse.json({ message: '쿠팡 업체코드 설정이 없습니다.' }, { status: 400 })
    }
    if (!user.marketSetting.coupangKey || !user.marketSetting.coupangSecret) {
      return NextResponse.json({ message: '쿠팡 키 또는 시크릿이 없습니다.' }, { status: 400 })
    }

    try {
      const { status, data } = await createProductCoupang({ productId, user })
      if (status === 'success') {
        return NextResponse.json({ message: data.message || '쿠팡 상품 업로드에 성공했습니다.' }, { status: 200 })
      }
      return NextResponse.json({ message: data.message }, { status: 500 })
    } catch (e) {
      console.error(e)
      await prisma.log.create({
        data: {
          content: `쿠팡 상품 업로드 실패 : ${e.message}`,
        },
      })

      return NextResponse.json({ message: e.message }, { status: 500 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
