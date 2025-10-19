'use server'
import { prisma } from '@repo/database'
import { getServerUser } from '@/lib/utils/server/getServerUser'
import { myForm } from './type'
import { kdayjs, successServerAction, throwServerAction } from '@repo/utils'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function updateUser(form: myForm) {
  try {
    const me = await getServerUser()
    await prisma.marketSetting.upsert({
      where: {
        userId: me.id,
      },
      update: form.marketSetting,
      create: {
        ...form.marketSetting,
        userId: me.id,
      },
    })
    return successServerAction('설정이 저장되었습니다.')
  } catch (e) {
    return throwServerAction('설정 저장에 실패했습니다.')
  }
}

export async function deleteS3Image({ key }: { key: string }) {
  try {
    if (!key) {
      return throwServerAction('S3 key가 필요합니다.')
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    })

    await s3Client.send(command)
    return successServerAction('이미지가 삭제되었습니다.')
  } catch (error) {
    console.error('S3 delete error:', error)
    return throwServerAction('S3에서 이미지 삭제에 실패했습니다.')
  }
}

export async function saveMarketSettings(form: {
  // 옵션 이미지 설정
  optionImagePosition: 'top' | 'bottom'

  // 교환/반품 배송비
  exchangeShippingFee: number
  returnShippingFee: number

  // 네이버 스마트스토어
  naver: {
    applicationId: string
    secretKey: string
    marketId: string
    marketName: string
    contact: string
  }

  // 쿠팡
  coupang: {
    apiKey: string
    secretKey: string
    vendorId: string
    marketId: string
    marketName: string
    outboundDays: number
  }

  // 11번가
  street11: {
    apiKey: string
    isGlobalSeller: boolean
  }

  // ESM (G마켓/옥션)
  esm: {
    id: string
    password: string
  }

  // 스마트스토어 상품명 설정
  addFirstOptionToProductName: boolean

  // 상단/하단 이미지
  topImages: string[]
  bottomImages: string[]
}) {
  try {
    const me = await getServerUser()

    await prisma.marketSetting.upsert({
      where: {
        userId: me.id,
      },
      update: {
        // 옵션 이미지 설정
        optionImagePosition: form.optionImagePosition.toUpperCase() as any,

        // 교환/반품 배송비
        exchangeShippingFee: form.exchangeShippingFee,
        returnShippingFee: form.returnShippingFee,

        // 네이버 스마트스토어
        smartStoreKey: form.naver.applicationId,
        smartStoreSecret: form.naver.secretKey,
        smartStoreMarketId: form.naver.marketId,
        smartStoreMarketName: form.naver.marketName,
        smartStoreAsPhoneNumber: form.naver.contact,

        // 쿠팡
        coupangKey: form.coupang.apiKey,
        coupangSecret: form.coupang.secretKey,
        coupangVendorId: form.coupang.vendorId,
        coupangMarketId: form.coupang.marketId,
        coupangMarketName: form.coupang.marketName,
        coupangOutboundTimeDay: form.coupang.outboundDays,

        // 11번가
        street11Key: form.street11.apiKey,
        street11IsGlobal: form.street11.isGlobalSeller,

        // ESM
        esmId: form.esm.id,
        esmPassword: form.esm.password,

        // 스마트스토어 상품명 설정
        smartStoreAddFirstOptionToProductName: form.addFirstOptionToProductName,

        // 이미지
        topImages: form.topImages,
        bottomImages: form.bottomImages,
      },
      create: {
        userId: me.id,

        // 옵션 이미지 설정
        optionImagePosition: form.optionImagePosition.toUpperCase() as any,

        // 교환/반품 배송비
        exchangeShippingFee: form.exchangeShippingFee,
        returnShippingFee: form.returnShippingFee,

        // 네이버 스마트스토어
        smartStoreKey: form.naver.applicationId,
        smartStoreSecret: form.naver.secretKey,
        smartStoreMarketId: form.naver.marketId,
        smartStoreMarketName: form.naver.marketName,
        smartStoreAsPhoneNumber: form.naver.contact,

        // 쿠팡
        coupangKey: form.coupang.apiKey,
        coupangSecret: form.coupang.secretKey,
        coupangVendorId: form.coupang.vendorId,
        coupangMarketId: form.coupang.marketId,
        coupangMarketName: form.coupang.marketName,
        coupangOutboundTimeDay: form.coupang.outboundDays,

        // 11번가
        street11Key: form.street11.apiKey,
        street11IsGlobal: form.street11.isGlobalSeller,

        // ESM
        esmId: form.esm.id,
        esmPassword: form.esm.password,

        // 스마트스토어 상품명 설정
        smartStoreAddFirstOptionToProductName: form.addFirstOptionToProductName,

        // 이미지
        topImages: form.topImages,
        bottomImages: form.bottomImages,
      },
    })

    return successServerAction('설정이 저장되었습니다.')
  } catch (e) {
    console.error('Market settings save error:', e)
    return throwServerAction('설정 저장에 실패했습니다.')
  }
}

export async function loadMarketSettings() {
  try {
    const me = await getServerUser()

    const settings = await prisma.marketSetting.findUnique({
      where: {
        userId: me.id,
      },
    })

    if (!settings) {
      return successServerAction('설정이 없습니다.', {
        settings: null,
      })
    }

    // MarketSetting을 SettingsView 형태로 변환
    const formattedSettings = {
      optionImagePosition: (settings.optionImagePosition?.toLowerCase() as 'top' | 'bottom') || 'top',
      exchangeShippingFee: settings.exchangeShippingFee || 0,
      returnShippingFee: settings.returnShippingFee || 0,
      naver: {
        applicationId: settings.smartStoreKey || '',
        secretKey: settings.smartStoreSecret || '',
        marketId: settings.smartStoreMarketId || '',
        marketName: settings.smartStoreMarketName || '',
        contact: settings.smartStoreAsPhoneNumber || '',
      },
      coupang: {
        apiKey: settings.coupangKey || '',
        secretKey: settings.coupangSecret || '',
        vendorId: settings.coupangVendorId || '',
        marketId: settings.coupangMarketId || '',
        marketName: settings.coupangMarketName || '',
        outboundDays: settings.coupangOutboundTimeDay || 1,
      },
      street11: {
        apiKey: settings.street11Key || '',
        isGlobalSeller: settings.street11IsGlobal || false,
      },
      esm: {
        id: settings.esmId || '',
        password: settings.esmPassword || '',
      },
      addFirstOptionToProductName: settings.smartStoreAddFirstOptionToProductName || false,
      topImages: settings.topImages || [],
      bottomImages: settings.bottomImages || [],
    }

    return successServerAction('설정을 불러왔습니다.', {
      settings: formattedSettings,
    })
  } catch (e) {
    console.error('Market settings load error:', e)
    return throwServerAction('설정 로드에 실패했습니다.')
  }
}
