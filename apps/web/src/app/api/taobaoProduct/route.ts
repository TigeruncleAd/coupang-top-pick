import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { productId, data, status } = body
    if (!productId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    // console.log(productId, data)
    if (status === 'fail') {
      await prisma.product.update({
        where: {
          id: BigInt(productId),
        },
        data: {
          status: 'FAILED',
        },
      })
      return NextResponse.json({ message: 'Success' }, { status: 200 })
    }

    try {
      const product = await prisma.product.update({
        where: {
          id: BigInt(productId),
        },
        data: {
          status: 'CRAWLED',
        },
        select: {
          id: true,
          taobaoProducts: {
            select: {
              id: true,
              taobaoId: true,
            },
          },
        },
      })

      const duplicatedIdMap = new Map<string, bigint>(
        product.taobaoProducts.map(taobaoProduct => [taobaoProduct.taobaoId, taobaoProduct.id]),
      )
      const duplicatedIds: bigint[] = []

      for (const item of data) {
        if (item.taobao_item_id) {
          const targetId = duplicatedIdMap.get(item.taobao_item_id)
          if (targetId) {
            duplicatedIds.push(targetId)
          }
        }
      }
      if (duplicatedIds.length > 0) {
        await prisma.taobaoProduct.updateMany({
          where: {
            id: {
              in: duplicatedIds,
            },
          },
          data: {
            matchedCount: {
              increment: 1,
            },
          },
        })
      }
      const newData = data.filter(item => !duplicatedIdMap.has(item.taobao_item_id))
      if (newData.length > 0) {
        await prisma.taobaoProduct.createMany({
          data: newData
            .filter(item => item.taobao_item_id && item.item_url)
            .map(item => ({
              targetProductId: BigInt(productId),
              taobaoId: item.taobao_item_id?.toString() ?? '',
              url: item.item_url,
              image: item?.main_image_url ?? '',
              price: Number(item.price ?? 0),
              name: '',
            })),
          skipDuplicates: true,
        })
      }
    } catch (e) {
      await prisma.product.update({
        where: {
          id: BigInt(productId),
        },
        data: {
          status: 'FAILED',
        },
      })
      return NextResponse.json({ message: 'Success' }, { status: 200 })
    }

    return NextResponse.json({ message: 'Success' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
//
// {
//   productId: '373',
//     original_image_url: 'https://shop-phinf.pstatic.net/20240904_95/1725438404174NVmmQ_JPEG/39755675985039892_482377004.jpg',
//   data: [
//   {
//     taobao_item_id: 667216931989,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=667216931989',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN019OXVgV2J8ie1dlp5u_!!2207312629377.jpg',
//     price: '12.54'
//   },
//   {
//     taobao_item_id: 745555989255,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=745555989255',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01LKoZPT2KRmu7Vqblw_!!2076509554.jpg',
//     price: '11.90'
//   },
//   {
//     taobao_item_id: 785432033931,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=785432033931',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN012TlRDH22MbPDWWcko_!!2200694547106.jpg',
//     price: '8.10'
//   },
//   {
//     taobao_item_id: 742523316064,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=742523316064',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01oM1AIp1o6CWidDdEi_!!1616845175.jpg',
//     price: '9.90'
//   },
//   {
//     taobao_item_id: 696858306696,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=696858306696',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01CI2fVm1MRRZiWpCcv_!!4077511431.jpg',
//     price: '31.50'
//   },
//   {
//     taobao_item_id: 785370130974,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=785370130974',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01KsyMqc1JfhCytGwM1_!!2212452481056.jpg',
//     price: '8.10'
//   },
//   {
//     taobao_item_id: 785439725210,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=785439725210',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN018h60Dk1Jgc0OZb1Rw_!!2212188591058.jpg',
//     price: '8.10'
//   },
//   {
//     taobao_item_id: 716016883392,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=716016883392',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01MrJqDl1GSSnGiik7V_!!4214770621.jpg',
//     price: '31.50'
//   },
//   {
//     taobao_item_id: 785437737082,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=785437737082',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01NbVynO1oRGpLKInkv_!!2207687315221.jpg',
//     price: '8.10'
//   },
//   {
//     taobao_item_id: 806909135735,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=806909135735',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01ONkKnT1dKtXMawp8f_!!1612353718.jpg',
//     price: '28.00'
//   },
//   {
//     taobao_item_id: 709894595076,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=709894595076',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01pLv2JJ1Ylqd6iIFTk_!!3541583100.jpg',
//     price: '11.90'
//   },
//   {
//     taobao_item_id: 702332873887,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=702332873887',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01yIiFFl1Ylqc8sWkv8_!!3541583100.jpg',
//     price: '9.90'
//   },
//   {
//     taobao_item_id: 762557062131,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=762557062131',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01dHvtNf1YlqikRbH7D_!!3541583100.jpg',
//     price: '9.50'
//   },
//   {
//     taobao_item_id: 836851110186,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=836851110186',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01QFFZ2M22dY5hpOMX6_!!2200637867143.jpg',
//     price: '28.73'
//   },
//   {
//     taobao_item_id: 839490551256,
//     item_url: 'https://item.taobao.com/item.htm?abbucket=8&id=839490551256',
//     main_image_url: 'https://img.alicdn.com/imgextra/O1CN01yM6cJx1BySXWYD6qU_!!6000000000014-0-tmap.jpg',
//     price: '10.14'
//   },
// }
