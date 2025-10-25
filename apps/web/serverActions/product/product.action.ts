'use server'

import { getServerUser } from '@/lib/utils/server/getServerUser'
import { prisma, type Product } from '@repo/database'
import type { WingProductSummary } from '@/types/wing'

export async function createProduct(productData: WingProductSummary): Promise<Product> {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // productId로 이미 존재하는지 확인
  const existingProduct = await prisma.product.findUnique({
    where: {
      productId: productData.productId,
    },
  })

  if (existingProduct) {
    throw new Error('이미 등록된 상품입니다.')
  }

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      productId: productData.productId,
      productName: productData.productName,
      brandName: productData.brandName,
      manufacture: productData.manufacture,
      itemId: productData.itemId,
      itemName: productData.itemName,
      vendorItemId: productData.vendorItemId,
      categoryId: productData.categoryId,
      displayCategoryInfo: JSON.parse(JSON.stringify(productData.displayCategoryInfo || [])),
      salePrice: productData.salePrice,
      itemCountOfProduct: productData.itemCountOfProduct || 0,
      imagePath: productData.imagePath,
      rating: productData.rating || 0,
      ratingCount: productData.ratingCount || 0,
      pvLast28Day: productData.pvLast28Day || 0,
      salesLast28d: productData.salesLast28d || 0,
      deliveryMethod: productData.deliveryMethod,
      matchType: productData.matchType || null,
      sponsored: productData.sponsored ? String(productData.sponsored) : null,
      matchingResultId: productData.matchingResultId ? String(productData.matchingResultId) : null,
      attributeTypes: productData.attributeTypes ? JSON.parse(JSON.stringify(productData.attributeTypes)) : null,
    },
  })

  return product
}

export async function getUserProducts(
  page: number = 1,
  pageSize: number = 20,
): Promise<{
  products: Product[]
  totalCount: number
  totalPages: number
  currentPage: number
}> {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const skip = (page - 1) * pageSize

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    }),
    prisma.product.count({
      where: {
        userId: user.id,
      },
    }),
  ])

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  }
}

export async function createProductsBulk(
  productsData: WingProductSummary[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const productData of productsData) {
    try {
      // productId로 이미 존재하는지 확인
      const existingProduct = await prisma.product.findUnique({
        where: {
          productId: productData.productId,
        },
      })

      if (existingProduct) {
        skipped++
        continue
      }

      await prisma.product.create({
        data: {
          userId: user.id,
          productId: productData.productId,
          productName: productData.productName,
          brandName: productData.brandName,
          manufacture: productData.manufacture,
          itemId: productData.itemId,
          itemName: productData.itemName,
          vendorItemId: productData.vendorItemId,
          categoryId: productData.categoryId,
          displayCategoryInfo: JSON.parse(JSON.stringify(productData.displayCategoryInfo || [])),
          salePrice: productData.salePrice,
          itemCountOfProduct: productData.itemCountOfProduct || 0,
          imagePath: productData.imagePath,
          rating: productData.rating || 0,
          ratingCount: productData.ratingCount || 0,
          pvLast28Day: productData.pvLast28Day || 0,
          salesLast28d: productData.salesLast28d || 0,
          deliveryMethod: productData.deliveryMethod,
          matchType: productData.matchType || null,
          sponsored: productData.sponsored ? String(productData.sponsored) : null,
          matchingResultId: productData.matchingResultId ? String(productData.matchingResultId) : null,
          attributeTypes: productData.attributeTypes ? JSON.parse(JSON.stringify(productData.attributeTypes)) : null,
        },
      })

      created++
    } catch (error) {
      errors.push(`상품 ID ${productData.productId}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { created, skipped, errors }
}

export async function deleteProduct(productId: bigint) {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const product = await prisma.product.findFirst({
    where: {
      productId,
      userId: user.id,
    },
  })

  if (!product) {
    throw new Error('상품을 찾을 수 없습니다.')
  }

  await prisma.product.delete({
    where: {
      id: product.id,
    },
  })

  return { success: true }
}

export async function updateProductStatus(productId: bigint, status: 'READY' | 'UPLOADED_RAW') {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const product = await prisma.product.findFirst({
    where: {
      productId,
      userId: user.id,
    },
  })

  if (!product) {
    throw new Error('상품을 찾을 수 없습니다.')
  }

  await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      status,
    },
  })

  return { success: true }
}
