'use server'

import { kdayjs, successServerAction, throwServerAction } from '@repo/utils'
import { prisma, Product, TaobaoProduct } from '@repo/database'
import { getServerUser } from '@/lib/utils/server/getServerUser'
const isDev = process.env.NODE_ENV === 'development'

export interface EditProduct extends Product {
  selectedTaobaoProduct: TaobaoProduct
}

export interface EditProductListProduct extends Partial<Product> {
  selectedTaobaoProduct: Partial<TaobaoProduct>
}

export async function getProductDetailList({
  dateString,
  page,
  size,
  query,
}: {
  dateString: string
  page: number
  size: number
  query?: string
}): Promise<{
  listData: EditProductListProduct[]
  totalCount: number
}> {
  const user = await getServerUser()
  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
      date: dateString,
      selectedTaobaoProduct: {
        status: 'CRAWLED',
      },
      myName: query ? { contains: query, mode: 'insensitive' } : undefined,
    },
    select: {
      id: true,
      name: true,
      myName: true,
      category: true,
      originalPrice: true,
      deliveryFee: true,
      myDeliveryFee: true,
      myMargin: true,
      image: true,
      url: isDev,
      selectedTaobaoProductId: true,
      misc: true,
      memo: true,
      discountedPrice: true,
      isSmartStoreUploaded: true,
      isCoupangUploaded: true,
      isEsmUploaded: true,
      isGmarketUploaded: true,
      isStreet11Uploaded: true,
      isOctionUploaded: true,
      options: true,
      deliveryAgencyFee: true,
      selectedTaobaoProduct: true,
    },
    orderBy: {
      id: 'asc',
    },
    skip: (page - 1) * size,
    take: size,
  })
  const totalCount = await prisma.product.count({
    where: {
      userId: user.id,
      date: dateString,
      selectedTaobaoProduct: {
        status: 'CRAWLED',
      },
      myName: query ? { contains: query, mode: 'insensitive' } : undefined,
    },
  })
  return {
    listData: products.map(product => ({
      ...product,
      options: (product.options as any).map(o => o.price),
      selectedTaobaoProduct: {
        ...product.selectedTaobaoProduct,
        options: (product.selectedTaobaoProduct?.options as any).map(o => o.price),
      },
    })),
    totalCount,
  }
}

export async function getProductDetail({ productId }: { productId: bigint }): Promise<EditProduct> {
  const user = await getServerUser()
  const product = await prisma.product.findUnique({
    where: { id: BigInt(productId), userId: user.id },
    include: {
      selectedTaobaoProduct: true,
    },
  })
  return product
}

export async function saveProduct({ form }: { form: EditProduct }) {
  const user = await getServerUser()
  try {
    const { id } = form
    const product = await prisma.product.findUnique({
      where: { id: BigInt(id) },
    })
    if (!product) throw new Error('상품을 찾을 수 없습니다.')
    if (product.userId !== user.id) throw new Error('권한이 없습니다.')
    const { selectedTaobaoProduct, myPrice, myDiscountedPrice, myDeliveryFee, myMargin, deliveryAgencyFee, myName } =
      form
    const { options, myData } = selectedTaobaoProduct
    await prisma.product.update({
      where: { id: BigInt(id) },
      data: {
        myName,
        myPrice,
        myDiscountedPrice,
        myDeliveryFee,
        myMargin,
        deliveryAgencyFee,
        selectedTaobaoProduct: {
          update: {
            options,
            myData,
          },
        },
      },
    })
    return successServerAction('상품이 저장되었습니다.')
  } catch (e) {
    console.error(e)
    return throwServerAction('상품 저장에 실패했습니다.')
  }
}

export async function saveProducts({ products }) {
  try {
    const targetProducts = products.filter(product => product.isEdited)
    const user = await getServerUser()
    for (const product of targetProducts) {
      try {
        await prisma.product.update({
          where: {
            id: BigInt(product.id),
            userId: user.id,
          },
          data: {
            myPrice: product.myPrice,
            myMargin: product.myMargin,
            myDeliveryFee: product.myDeliveryFee,
            myName: product.myName || product.name,
            memo: product.memo,
          },
        })
      } catch (e) {
        console.error(e)
        continue
      }
    }
    return successServerAction('변경사항이 저장되었습니다.')
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
      },
    })
    // return successServerAction('상품이 삭제되었습니다.')
    return {
      status: 'success',
      message: '상품이 삭제되었습니다.',
      id: productId,
    }
  } catch (e) {
    console.error(e)
    return throwServerAction('상품 삭제에 실패했습니다.')
  }
}

//https://r73w3fyv93.execute-api.ap-northeast-2.amazonaws.com/taoworld/function_api?requestId={requestId}&imgUrl={imgUrl}
