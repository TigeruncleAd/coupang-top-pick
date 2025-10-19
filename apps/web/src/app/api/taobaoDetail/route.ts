import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { v4 as uuidv4 } from 'uuid'
interface ProductOption {
  sku_id: number
  price: number
  img_url: string
  cn_prop_type: string
  cn_name: string
  ko_prop_type: string
  ko_name: string
}

/**
 * API 요청 Body의 전체 데이터 구조에 대한 인터페이스
 */
interface ProductRequestBody {
  product_id?: string // 물음표(?)는 선택적(Optional) 필드를 의미합니다.
  request_img_url?: string
  tao_product_id: string
  tao_product_title: string
  ko_tao_product_title: string
  description?: string
  thumnail_imgs?: string[]
  tao_product_options: ProductOption[]
  status: string
}
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log(body)
    const detailData: ProductRequestBody = body
    if (!detailData.product_id || !detailData.tao_product_id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (detailData.status === 'fail') {
      await prisma.taobaoProduct.update({
        where: {
          id: BigInt(detailData.product_id),
        },
        data: {
          status: 'FAILED',
        },
      })
      return NextResponse.json({ message: 'Success' }, { status: 200 })
    }
    const existTaobaoProduct = await prisma.taobaoProduct.findUnique({
      where: {
        id: BigInt(detailData.product_id),
      },
      select: {
        id: true,
        taobaoId: true,
      },
    })
    if (!existTaobaoProduct) {
      return NextResponse.json({ error: 'taobaoproduct not found' }, { status: 200 })
    }

    if (existTaobaoProduct.taobaoId !== detailData.tao_product_id) {
      return NextResponse.json({ error: 'product not found' }, { status: 200 })
    }
    const originalData = {
      koName: detailData.ko_tao_product_title || detailData.tao_product_title || '',
      cnName: detailData.tao_product_title || '',
      detail: detailData.description || '',
      thumbnails:
        detailData.thumnail_imgs?.map(t => ({
          id: uuidv4(),
          url: t,
        })) || [],
      options: (detailData.tao_product_options || []) as any,
    }
    await prisma.taobaoProduct.update({
      where: {
        id: existTaobaoProduct.id,
      },
      data: {
        status: 'CRAWLED',
        originalData: originalData,
        myData: originalData,
      },
    })

    return NextResponse.json({ message: 'Success' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
