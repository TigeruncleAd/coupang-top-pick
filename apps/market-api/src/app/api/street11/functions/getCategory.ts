import { prisma } from '@repo/database'

export async function getStreet11CategoryFromSmartStore(smartStoreId: string) {
  const category = await prisma.category.findFirst({
    where: {
      smartStoreId: smartStoreId,
    },
    select: {
      id: true,
      street11Id: true,
      smartStoreId: true,
    },
  })

  console.log('category : ', category.smartStoreId)
  if (!category) {
    throw new Error(`카테고리를 찾을 수 없습니다. (smartStoreId: ${smartStoreId})`)
  }

  return category
}
