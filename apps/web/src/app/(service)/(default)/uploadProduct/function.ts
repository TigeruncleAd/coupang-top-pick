import { toast } from 'sonner'
import { getImageBlob, updateEsmResult } from './serverAction'
import { Product, MarketSetting } from '@repo/database'
import { LoadingCircle } from '@repo/ui'
import React from 'react'

/**
 * Base64 이미지를 리사이징하는 함수
 * @param base64String 리사이징할 Base64 이미지 문자열
 * @returns 리사이징된 Base64 이미지 문자열
 */
export async function resizeBase64Image(base64String: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // 캔버스 생성
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 캔버스 크기 설정 (최소 600x600)
      canvas.width = Math.max(600, img.width)
      canvas.height = Math.max(600, img.height)

      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'))
        return
      }

      // 배경을 흰색으로 채움
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 이미지를 캔버스 중앙에 그림
      const x = (canvas.width - img.width) / 2
      const y = (canvas.height - img.height) / 2
      ctx.drawImage(img, x, y)

      // base64로 변환
      const resizedBase64String = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
      resolve(resizedBase64String)
    }

    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'))
    }

    img.src = `data:image/jpeg;base64,${base64String}`
  })
}

/**
 * ESM 상품 업로드 함수
 * @param productId 업로드할 상품 ID
 * @param listDataState 상품 목록 상태
 * @param marketSetting 마켓 설정 정보
 * @param setEsmChild ESM 창 상태 설정 함수
 * @param setUploadingResults 업로드 결과 설정 함수
 */
export async function handleEsmUpload(
  productId: bigint,
  listDataState: Product[],
  marketSetting: MarketSetting,
  setEsmChild: (child: any) => void,
  setUploadingResults: (results: any) => void,
) {
  try {
    if (!marketSetting) {
      toast.error('마켓 설정이 없습니다.')
      return
    }

    const product = listDataState.find(product => product.id === productId)

    if (!product) {
      toast.error('상품을 찾을 수 없습니다.')
      return
    }

    if (product.gmarketProductId || product.octionProductId || product.isEsmUploaded) {
      //wait 100ms
      setTimeout(() => {
        window?.postMessage({
          action: 'reportResultKss',
          productId,
          status: 'error',
          message: '이미 ESM에 등록된 상품입니다.',
        })
      }, 100)
      return
    }

    const image = product.image
    const thumbnails = product.thumbnails
    const images = thumbnails.length > 0 ? thumbnails : [image.split('?')[0]]

    // 먼저 base64로 변환 후 리사이징
    const base64Images = await Promise.all(images.map(image => getImageBlob(image)))
    const imageBlobs = await Promise.all(base64Images.map(base64 => resizeBase64Image(base64)))

    const child = window.open('https://www.esmplus.com/Home/v2/goods-register', '_blank', 'width=100,height=100')
    setEsmChild(child)

    //wait 1000ms
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        child?.postMessage(
          {
            action: 'setProductData',
            product: product,
            images: imageBlobs,
            topImages: marketSetting?.topImages,
            bottomImages: marketSetting?.bottomImages,
            margin: marketSetting?.esmMargin,
            id: marketSetting?.esmId || '',
            pw: marketSetting?.esmPassword || '',
          },
          '*',
        )
      }, i * 1000)
    }
  } catch (e) {
    console.error(e)
    setTimeout(() => {
      window?.postMessage({
        action: 'reportResultKss',
        productId,
        status: 'error',
        message: 'ESM 상품 업로드에 실패했습니다. : ' + e.message,
      })
    }, 100)
  }
}

/**
 * ESM 이벤트 리스너 생성 함수
 * @param selectedProductIds 선택된 상품 ID 배열
 * @param isESMUploading ESM 업로드 중 상태
 * @param handleEsmUploadFn ESM 업로드 함수
 * @param setUploadingResults 업로드 결과 설정 함수
 * @returns 이벤트 리스너 함수
 */
export const createEsmEventListener = (
  selectedProductIds: bigint[],
  isESMUploading: boolean,
  handleEsmUploadFn: (productId: bigint) => void,
  setUploadingResults: (callback: (prev: any[]) => any[]) => void,
) => {
  return async (event: MessageEvent) => {
    if (event.data.action === 'reportResultKss') {
      const { octionId, gmarketId, productId, status, message } = event.data
      console.log(event.data)
      if (status === 'success') {
        await updateEsmResult({ productId, octionId, gmarketId })
        setUploadingResults(prev => {
          const newResults = [...prev]
          const targetResult = newResults.find(result => result.productId === productId)
          if (targetResult) {
            targetResult.ESM = {
              data: {
                message: 'ESM 상품 업로드에 성공했습니다.',
              },
              status: 'success',
            }
          } else {
            newResults.push({
              productId,
              ESM: { data: { message: 'ESM 상품 업로드에 성공했습니다.' }, status: 'success' },
            })
          }
          return newResults
        })
      } else {
        setUploadingResults(prev => {
          const newResults = [...prev]
          const targetResult = newResults.find(result => result.productId === productId)
          if (targetResult) {
            targetResult.ESM = {
              data: { message: message || 'ESM 상품 업로드에 실패했습니다.' },
              status: 'error',
            }
          } else {
            newResults.push({
              productId,
              ESM: { data: { message: message || 'ESM 상품 업로드에 실패했습니다.' }, status: 'error' },
            })
          }
          return newResults
        })
      }

      if (isESMUploading) {
        const currentProductIdx = selectedProductIds.findIndex(id => id === productId)
        if (currentProductIdx !== -1 && currentProductIdx < selectedProductIds.length - 1) {
          handleEsmUploadFn(selectedProductIds[currentProductIdx + 1])
        }
      }
    }
  }
}
