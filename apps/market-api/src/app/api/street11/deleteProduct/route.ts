import { NextResponse } from 'next/server'
import { getUserFromUserToken } from '../../../../../server/utils/getUserFromUserToken'
import { prisma } from '@repo/database'
import iconv from 'iconv-lite'

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
    if (!user.marketSetting.street11Key) {
      return NextResponse.json({ message: '11번가 API key가 없습니다.' }, { status: 400 })
    }
    const product = await prisma.product.findUnique({
      where: {
        id: BigInt(productId),
        userId: user.id,
      },
    })

    if (!product || !product.street11ProductId) {
      return NextResponse.json({ message: '11번가 상품 번호가 없습니다.' }, { status: 400 })
    }

    // TODO : 11번가 상품 삭제 로직
    const token = user.marketSetting.street11Key
    const response = await fetch(
      `http://api.11st.co.kr/rest/prodstatservice/stat/stopdisplay/${product.street11ProductId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/xml; charset=EUC-KR',
          openapikey: token,
        },
      },
    )

    const buffer = await response.arrayBuffer()
    const responseBody = iconv.decode(Buffer.from(buffer), 'euc-kr')

    console.log('responseBody : ', responseBody)

    const getMessage = xml => {
      const messageMatch = xml.match(/<message>(.*?)<\/message>/)
      return messageMatch ? messageMatch[1] : ''
    }

    const getResultCode = xml => {
      const codeMatch = xml.match(/<resultCode>(.*?)<\/resultCode>/)
      return codeMatch ? codeMatch[1] : ''
    }

    const resultCode = getResultCode(responseBody)
    const message = getMessage(responseBody)
    if (resultCode === '200') {
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          street11ProductId: '',
        },
      })
      return NextResponse.json({ message: '11번가 상품 판매 중지에 성공했습니다.' }, { status: 200 })
    } else {
      throw new Error(resultCode + ' error : ' + message)
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
