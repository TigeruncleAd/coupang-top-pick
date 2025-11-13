'use client'
const isDev = process.env.NODE_ENV === 'development'
export type PushToExtensionPayload = {
  type: string
  [key: string]: any
}

export type PushToExtensionResult = {
  status: 'success' | 'error'
  data: any
}

export async function pushToExtension({
  extensionId,
  payload,
}: {
  extensionId: string
  payload: PushToExtensionPayload
}): Promise<PushToExtensionResult> {
  return new Promise(resolve => {
    try {
      // Guard: chrome runtime API is not available on normal web pages
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        resolve({ status: 'error', data: null })
        return
      }
      chrome.runtime.sendMessage(extensionId, payload, (res: any) => {
        resolve(res)
      })
    } catch {
      resolve({ status: 'error', data: null })
    }
  })
}

export async function openOffscreenWindowExt({
  extensionId,
  targetUrl,
}: {
  extensionId: string
  targetUrl: string
}): Promise<PushToExtensionResult> {
  if (isDev) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
    return { status: 'success', data: null }
  } else {
    return await pushToExtension({ extensionId, payload: { type: 'RUN_HIDDEN_TASK', payload: { targetUrl } } })
  }
}

export async function wingSearchViaExtension({
  extensionId,
  keyword,
  searchPage = 0,
  searchOrder = 'DEFAULT',
  sortType = 'DEFAULT',
  excludedProductIds = [],
}: {
  extensionId: string
  keyword: string
  searchPage?: number
  searchOrder?: string
  sortType?: string
  excludedProductIds?: string[]
}) {
  return await pushToExtension({
    extensionId,
    payload: {
      type: 'WING_SEARCH',
      payload: { keyword, searchPage, searchOrder, sortType, excludedProductIds },
    },
  })
}

export async function wingProductItemsViaExtension({
  extensionId,
  productId,
  itemId,
  categoryId,
  allowSingleProduct = true,
  targetTabUrl,
  productName,
  vendorItemId,
  optionOrder,
  attributeValues,
  firstAttributeValue,
  salePrice,
}: {
  extensionId: string
  productId: number
  itemId: number
  categoryId: number
  allowSingleProduct?: boolean
  targetTabUrl?: string
  productName?: string
  vendorItemId?: number
  optionOrder?: string[]
  attributeValues?: string[]
  firstAttributeValue?: string | null
  salePrice?: number
}) {
  return await pushToExtension({
    extensionId,
    payload: {
      type: 'WING_PRODUCT_ITEMS',
      payload: {
        productId,
        itemId,
        categoryId,
        allowSingleProduct,
        targetTabUrl,
        productName,
        vendorItemId,
        optionOrder,
        attributeValues,
        firstAttributeValue,
        salePrice,
      },
    },
  })
}

/**
 * 확장 프로그램 스토리지에서 최신 productId를 가져옵니다
 */
export async function getLatestProductIdFromExtension({
  extensionId,
}: {
  extensionId: string
}): Promise<{ status: 'success' | 'error'; productId?: string }> {
  return new Promise(resolve => {
    try {
      console.log('🔍 getLatestProductIdFromExtension 시작')
      console.log('📤 extensionId:', extensionId)

      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        console.log('❌ Chrome runtime not available')
        resolve({ status: 'error' })
        return
      }

      console.log('📤 확장 프로그램에 메시지 전송:', { type: 'GET_LATEST_PRODUCT_ID' })
      chrome.runtime.sendMessage(extensionId, { type: 'GET_LATEST_PRODUCT_ID' }, (res: any) => {
        console.log('📥 확장 프로그램 응답:', res)

        if (res?.status === 'success' && res?.productId) {
          console.log('✅ productId 성공적으로 받음:', res.productId)
          resolve({ status: 'success', productId: res.productId })
        } else {
          console.log('❌ productId 받기 실패:', res)
          resolve({ status: 'error' })
        }
      })
    } catch (error) {
      console.log('❌ getLatestProductIdFromExtension 오류:', error)
      resolve({ status: 'error' })
    }
  })
}

/**
 * 확장 프로그램 스토리지에서 productId를 삭제합니다
 */
export async function clearLatestProductIdFromExtension({
  extensionId,
}: {
  extensionId: string
}): Promise<{ status: 'success' | 'error' }> {
  return new Promise(resolve => {
    try {
      console.log('🗑️ clearLatestProductIdFromExtension 시작')
      console.log('📤 extensionId:', extensionId)

      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        console.log('❌ Chrome runtime not available')
        resolve({ status: 'error' })
        return
      }

      console.log('📤 확장 프로그램에 메시지 전송:', { type: 'CLEAR_LATEST_PRODUCT_ID' })
      chrome.runtime.sendMessage(extensionId, { type: 'CLEAR_LATEST_PRODUCT_ID' }, (res: any) => {
        console.log('📥 확장 프로그램 응답:', res)
        resolve(res || { status: 'error' })
      })
    } catch (error) {
      console.log('❌ clearLatestProductIdFromExtension 오류:', error)
      resolve({ status: 'error' })
    }
  })
}

/**
 * 쿠팡 상품 페이지에서 option-picker-container 존재 여부 체크
 */
export async function checkCoupangOptionPicker({
  extensionId,
  productId,
  itemId,
  vendorItemId,
}: {
  extensionId: string
  productId: number
  itemId: number
  vendorItemId: number
}): Promise<{ ok: boolean; hasOptionPicker?: boolean; optionCount?: number; optionOrder?: string[]; firstAttributeValue?: string | null; rocketBadgeRatio?: number; rocketBadgeCount?: number; totalOptionCount?: number; isFirstOptionSoldOut?: boolean; error?: string }> {
  return new Promise(resolve => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        resolve({ ok: false, error: 'Chrome runtime not available' })
        return
      }

      chrome.runtime.sendMessage(
        extensionId,
        {
          type: 'CHECK_COUPANG_OPTION_PICKER',
          payload: { productId, itemId, vendorItemId },
        },
        (res: any) => {
          resolve(res || { ok: false, error: 'No response' })
        },
      )
    } catch (error) {
      resolve({ ok: false, error: String(error) })
    }
  })
}

/**
 * Wing API를 호출하여 attributeValues 추출 (검증 전용)
 */
export async function wingAttributeCheckViaExtension({
  extensionId,
  productId,
  itemId,
  categoryId,
  optionOrder,
}: {
  extensionId: string
  productId: number
  itemId: number
  categoryId: number
  optionOrder: string[]
}): Promise<PushToExtensionResult> {
  return await pushToExtension({
    extensionId,
    payload: {
      type: 'WING_ATTRIBUTE_CHECK',
      payload: { productId, itemId, categoryId, optionOrder },
    },
  })
}

/**
 * formV2 탭을 닫습니다 (검증 후 정리용)
 */
export async function closeFormV2Tab({
  extensionId,
}: {
  extensionId: string
}): Promise<{ ok: boolean; closed?: number; error?: string }> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        resolve({ ok: false, error: 'Chrome runtime not available' })
        return
      }

      chrome.runtime.sendMessage(extensionId, { type: 'CLOSE_FORMV2_TAB' }, (res: any) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message })
          return
        }
        resolve(res || { ok: false, error: 'no_response' })
      })
    } catch (error) {
      resolve({ ok: false, error: String(error) })
    }
  })
}

/**
 * Wing 옵션 수정 버튼 클릭 (옵션수정 모달 열기)
 */
export async function wingOptionModifyViaExtension({
  extensionId,
  vendorInventoryId,
  targetTabUrl,
}: {
  extensionId: string
  vendorInventoryId: string
  targetTabUrl?: string
}): Promise<PushToExtensionResult> {
  return await pushToExtension({
    extensionId,
    payload: {
      type: 'WING_OPTION_MODIFY',
      payload: { vendorInventoryId, targetTabUrl },
    },
  })
}
