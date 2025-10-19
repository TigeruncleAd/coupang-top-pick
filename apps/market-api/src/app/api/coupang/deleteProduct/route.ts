import { NextResponse } from 'next/server'
import { getUserFromUserToken } from '../../../../../server/utils/getUserFromUserToken'
import { prisma } from '@repo/database'
import crypto from 'crypto'

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
    const product = await prisma.product.findUnique({
      where: {
        id: BigInt(productId),
        userId: user.id,
      },
    })
    if (!product || !product.coupangProductId) {
      return NextResponse.json({ message: '쿠팡 상품 번호가 없습니다.' }, { status: 400 })
    }
    try {
      const { coupangKey, coupangSecret } = user.marketSetting
      const ACCESS_KEY = coupangKey
      const SECRET_KEY = coupangSecret

      const uploadDatetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + 'Z'
      const uploadMethod = 'DELETE'
      const uploadPath = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${product.coupangProductId}`
      const uploadQuery = ''

      const uploadMessage = uploadDatetime + uploadMethod + uploadPath + uploadQuery
      const uploadUrlPath = uploadPath + '?' + uploadQuery

      const algorithm = 'sha256'

      const uploadSignature = crypto.createHmac(algorithm, SECRET_KEY).update(uploadMessage).digest('hex')
      const uploadAuthorization =
        'CEA algorithm=HmacSHA256, access-key=' +
        ACCESS_KEY +
        ', signed-date=' +
        uploadDatetime +
        ', signature=' +
        uploadSignature
      const res = await fetch(`https://api-gateway.coupang.com${uploadUrlPath}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          Authorization: uploadAuthorization,
          // 'X-EXTENDED-TIMEOUT': 90000,
        },
      })
      if (res.status !== 200) {
        return NextResponse.json({ message: '쿠팡 상품 삭제에 실패했습니다.' }, { status: 500 })
      }
    } catch (e) {
      console.error(e)
      return NextResponse.json({ message: '쿠팡 상품 삭제에 실패했습니다.' }, { status: 500 })
    }
    await prisma.product.update({
      where: {
        id: BigInt(productId),
      },
      data: {
        coupangProductId: '',
      },
    })

    return NextResponse.json({ message: '쿠팡 상품 삭제에 성공했습니다.' }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
