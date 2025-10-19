import { getTokenSmartStore } from './../functions/token'
import { NextResponse } from 'next/server'
import { getUserFromUserToken } from '../../../../../server/utils/getUserFromUserToken'
import { prisma } from '@repo/database'
import { SMART_STORE_HOST } from '../functions/const'

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

    if (!product || !product.smartStoreProductId) {
      return NextResponse.json({ message: '스마트스토어 상품 번호가 없습니다.' }, { status: 400 })
    }

    const token = await getTokenSmartStore(user)
    const response = await fetch(`${SMART_STORE_HOST}/v2/products/channel-products/${product.smartStoreProductId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      if (errorData.code === 'NOT_FOUND') {
        await resetSmartStoreProductId(product.id)
        return NextResponse.json({ message: '스마트스토어 상품 삭제에 성공했습니다.' }, { status: 200 })
      } else
        return NextResponse.json(
          { message: '스마트스토어 상품 삭제에 실패했습니다. ' + errorData.message },
          { status: 500 },
        )
    }

    await resetSmartStoreProductId(product.id)
    return NextResponse.json({ message: '스마트스토어 상품 삭제에 성공했습니다.' }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

async function resetSmartStoreProductId(productId: bigint) {
  await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      smartStoreProductId: '',
    },
  })
}
