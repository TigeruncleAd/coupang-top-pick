'use server'

import { kdayjs, successServerAction, throwServerAction } from '@repo/utils'
import { prisma } from '@repo/database'
import type { Product, TaobaoProduct, User } from '@repo/database'
import { getServerUser } from '../../../../../../../lib/utils/server/getServerUser'
import { SQS, SQSClient } from '@aws-sdk/client-sqs'
const sqs = new SQS({
  region: process.env.AWS_REGION ?? '',
  credentials: {
    accessKeyId: process.env.SQS_QUEUE_KEY ?? '',
    secretAccessKey: process.env.SQS_QUEUE_SECRET ?? '',
  },
})
const queueUrl = process.env.SQS_QUEUE_URL

export async function fetchMatchTaobao({ date, query }: { date: string; query?: string }): Promise<{
  listData: (Product & {
    taobaoProducts: TaobaoProduct[]
    selectedTaobaoProduct?: {
      status: string
    } | null
  })[]
}> {
  const user = await getServerUser()
  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
      date: date,
      myName: query ? { contains: query, mode: 'insensitive' } : undefined,
    },
    select: {
      id: true,
      status: true,
      image: true,
      name: true,
      originalPrice: true,
      discountedPrice: true,
      deliveryFee: true,
      thumbnails: true,
      category: true,
      selectedTaobaoProductId: true,
      taobaoProducts: {
        orderBy: [{ matchedCount: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          url: true,
          taobaoId: true,
          image: true,
          price: true,
          priceUnit: true,
          matchedCount: true,
          status: true,
        },
      },
      selectedTaobaoProduct: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  })

  return { listData: products as any }
}

export async function makeTaobaoImageSearchQueue({ selectedProductIds, isAll, date }) {
  try {
    const user = await getServerUser()
    const products = isAll
      ? await prisma.product.findMany({
          where: {
            userId: user.id,
            status: {
              in: ['PENDING', 'FAILED'],
            },
            date: date,
          },
          select: {
            id: true,
            status: true,
            thumbnails: true,
          },
          orderBy: {
            id: 'asc',
          },
        })
      : await prisma.product.findMany({
          where: {
            userId: user.id,
            id: {
              in: selectedProductIds,
            },
          },
          select: {
            id: true,
            status: true,
            thumbnails: true,
          },
          orderBy: {
            id: 'asc',
          },
        })
    if (!products.length) {
      return throwServerAction('수집 할 상품이 없습니다.')
    }
    const { remainingProductCount } = user

    if (products.length > remainingProductCount) {
      return throwServerAction('남은 상품 검색 횟수가 부족합니다.')
    }

    const size = 10

    // const entries = products
    //   .map(product =>
    //     product.thumbnails.map((thumbnail, idx) => ({
    //       Id: `${product.id.toString()}-${idx}`,
    //       MessageBody: JSON.stringify({
    //         imageSrc: thumbnail.split('?')[0],
    //         targetProductId: product.id.toString(),
    //         type: 'image',
    //         from: 'titan',
    //         tryCount: 0,
    //       }),
    //     })),
    //   )
    //   .flat()
    const entries = products
      .filter(product => product.thumbnails.length > 0)
      .map((product, idx) => ({
        Id: `${product.id.toString()}-${idx}-image`,
        MessageBody: JSON.stringify({
          imageSrc: product.thumbnails[0]?.split('?')[0],
          targetProductId: product.id.toString(),
          type: 'image',
          from: 'titan',
          tryCount: 0,
        }),
      }))
    const total = Math.ceil(entries.length / size)
    for (let i = 0; i < total; i++) {
      const targetEntries = entries.slice(i * size, (i + 1) * size)

      await sqs.sendMessageBatch(
        {
          QueueUrl: queueUrl,
          Entries: targetEntries,
        },
        {},
      )
    }
    await prisma.product.updateMany({
      where: {
        id: {
          in: products.map(product => product.id),
        },
      },
      data: {
        status: 'CRAWLING',
      },
    })
    await prisma.taobaoProduct.deleteMany({
      where: {
        targetProductId: {
          in: products.map(product => product.id),
        },
      },
    })
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        remainingProductCount: user.remainingProductCount - products.length,
      },
    })
    return successServerAction('타오바오 이미지 검색 큐가 생성되었습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('타오바오 이미지 검색 큐 생성에 실패했습니다.')
  }
}

export async function matchTaobaoProduct({ productId, taobaoProductId }) {
  try {
    const user = await getServerUser()
    const taobaoProduct = await prisma.taobaoProduct.findUnique({
      where: {
        id: BigInt(taobaoProductId),
      },
      select: {
        id: true,
        taobaoId: true,
        image: true,
        targetProductId: true,
        status: true,
      },
    })
    if (!taobaoProduct) {
      return throwServerAction('상품을 찾을 수 없습니다.')
    }
    if (taobaoProduct.status !== 'CRAWLED') {
      const entry = {
        Id: `${taobaoProduct.id.toString()}-${user.id.toString()}-detail`,
        MessageBody: JSON.stringify({
          taobaoProductId: taobaoProduct.taobaoId,
          targetProductId: taobaoProduct.id.toString(),
          type: 'detail',
          from: 'titan',
          tryCount: 0,
          option: 'a',
          imageSrc: taobaoProduct.image,
        }),
      }
      await sqs.sendMessage(
        {
          QueueUrl: queueUrl,
          MessageBody: entry.MessageBody,
        },
        {},
      )

      await prisma.taobaoProduct.update({
        where: {
          id: BigInt(taobaoProductId),
        },
        data: {
          status: 'CRAWLING',
        },
      })
    }
    await prisma.product.update({
      where: {
        id: taobaoProduct.targetProductId,
      },
      data: {
        selectedTaobaoProductId: BigInt(taobaoProductId),
      },
    })

    return successServerAction('타오바오 상품 매칭에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('타오바오 상품 매칭에 실패했습니다.')
  }
}

export async function deleteProduct({ productId }) {
  try {
    const user = await getServerUser()
    await prisma.product.delete({
      where: {
        id: BigInt(productId),
        userId: user.id,
        marketUploadStatus: 'PENDING',
      },
    })
    return successServerAction('상품이 삭제되었습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('상품 삭제에 실패했습니다.')
  }
}

export async function matchTaobaoProductMany({
  products,
}: {
  products: { productId: bigint; taobaoProductId: bigint }[]
}) {
  try {
    const user = await getServerUser()
    const taobaoProducts = await prisma.taobaoProduct.findMany({
      where: {
        id: {
          in: products.filter(product => product.taobaoProductId).map(product => product.taobaoProductId),
        },
      },
      select: {
        id: true,
        status: true,
        targetProductId: true,
        taobaoId: true,
        image: true,
      },
    })
    const entries = []
    for (const taobaoProduct of taobaoProducts) {
      if (taobaoProduct.status !== 'CRAWLED') {
        const entry = {
          Id: `${taobaoProduct.id.toString()}-${user.id.toString()}-detail`,
          MessageBody: JSON.stringify({
            taobaoProductId: taobaoProduct.taobaoId.toString(),
            targetProductId: taobaoProduct.id.toString(),
            type: 'detail',
            from: 'titan',
            tryCount: 0,
            option: 'a',
            imageSrc: taobaoProduct.image,
          }),
        }
        entries.push(entry)
        await prisma.taobaoProduct.update({
          where: {
            id: taobaoProduct.id,
          },
          data: {
            status: 'CRAWLING',
          },
        })
      }
      await prisma.product.update({
        where: {
          id: taobaoProduct.targetProductId,
        },
        data: {
          selectedTaobaoProductId: taobaoProduct.id,
        },
      })
    }
    const size = 10
    const total = Math.ceil(entries.length / size)
    for (let i = 0; i < total; i++) {
      const targetEntries = entries.slice(i * size, (i + 1) * size)

      await sqs.sendMessageBatch(
        {
          QueueUrl: queueUrl,
          Entries: targetEntries,
        },
        {},
      )
    }

    return successServerAction('타오바오 상품 매칭에 성공했습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('타오바오 상품 매칭에 실패했습니다.')
  }
}

export async function getPatchNormal() {
  const patch = await prisma.misc.findUnique({
    where: {
      key: 'patch_normal',
    },
  })
  return patch?.value as { url: string; date: string; version: string; detail: string } | null
}

//https://r73w3fyv93.execute-api.ap-northeast-2.amazonaws.com/taoworld/function_api?requestId={requestId}&imgUrl={imgUrl}
