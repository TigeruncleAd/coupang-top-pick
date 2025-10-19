'use server'

import { prisma } from '@repo/database'
export async function getCNYCurrency() {
  try {
    const currency = await prisma.setting.findUnique({
      where: {
        key: 'CNY_CURRENCY',
      },
    })
    return parseFloat(currency?.value || '195')
  } catch (e) {
    return 195.0
  }
}
