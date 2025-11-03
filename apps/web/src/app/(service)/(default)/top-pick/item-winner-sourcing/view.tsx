'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import { Switch } from '@repo/ui/components/switch'
import { Label } from '@repo/ui/components/label'
import {
  wingSearchViaExtension,
  openOffscreenWindowExt,
  pushToExtension,
  checkCoupangOptionPicker,
  wingProductItemsViaExtension,
  wingAttributeCheckViaExtension,
  closeFormV2Tab,
} from '@/lib/utils/extension'
import type { WingSearchHttpEnvelope, WingProductSummary, WingProductItemsDetail } from '@/types/wing'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, createProductsBulk } from '@/serverActions/product/product.action'
import { toast } from 'sonner'
import ProductCard from './ProductCard'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui/components/collapsible'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

const MIN_ITEM_COUNT_OF_PRODUCT = 3

type ValidationResult = {
  productId: number
  hasOptionPicker: boolean
  optionCount: number
  optionOrder?: string[]
  attributeValues?: string[]
  error?: string
}

export default function Client({ extensionId }: { extensionId: string }) {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<WingSearchHttpEnvelope | null>(null)
  const [error, setError] = useState<string>('')
  const [isJsonOpen, setIsJsonOpen] = useState(false)
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set())
  const [isValidating, setIsValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 })
  const [isValidatingAndSaving, setIsValidatingAndSaving] = useState(false)
  const [validatingProductIds, setValidatingProductIds] = useState<Set<number>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  const productRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // 상품 생성 mutation
  const createProductMutation = useMutation({
    mutationFn: (product: WingProductSummary) => createProduct(product),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['userProducts'] })
      // 저장된 상품 Set에 추가 (productId)
      setSavedProducts(prev => new Set(prev).add(product.productId.toString()))
      toast.success('상품이 저장되었습니다.')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 저장에 실패했습니다.')
    },
  })

  // 일괄 저장 mutation
  const createProductsBulkMutation = useMutation({
    mutationFn: (products: WingProductSummary[]) => createProductsBulk(products),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['userProducts'] })

      if (result.created > 0) {
        toast.success(`${result.created}개 상품이 저장되었습니다.`)
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped}개 상품은 이미 등록되어 건너뛰었습니다.`)
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length}개 상품 저장 실패`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '일괄 저장에 실패했습니다.')
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      // 1) WING 페이지를 오프스크린으로 먼저 열어 콘텐츠 스크립트 준비
      await openOffscreenWindowExt({
        extensionId,
        targetUrl: 'https://wing.coupang.com/tenants/seller-web/vendor-inventory/formV2',
      })
      // 2) 소폭 대기 후 WING_SEARCH 호출 (백그라운드에서 PING 핸드셰이크 있음)
      await new Promise(r => setTimeout(r, 500))
      const res = await wingSearchViaExtension({ extensionId, keyword })
      console.log('🔍 res', res)
      if (res?.status !== 'success') {
        setError('요청 실패')
        setResult(null)
        return
      }
      const envelope = res.data as WingSearchHttpEnvelope
      if (!envelope?.ok) {
        setError('검색 실패')
        setResult(null)
        return
      }

      // 필터링된 결과만 저장
      const filteredResults =
        envelope.data?.result
          ?.filter(p => p.deliveryMethod === 'DOMESTIC' && (p.itemCountOfProduct ?? 0) >= MIN_ITEM_COUNT_OF_PRODUCT)
          .slice(0, 20) ?? []

      // 벌크 모드에 따라 결과 처리
      if (isBulkMode && result?.data?.result) {
        // 벌크 모드: 기존 결과에 추가 (중복 제거)
        const existingResults = result.data.result
        const existingProductIds = new Set(existingResults.map(p => p.productId))

        // 중복되지 않는 상품만 추가
        const newResults = filteredResults.filter(p => !existingProductIds.has(p.productId))
        const combinedResults = [...existingResults, ...newResults]

        setResult({
          ...envelope,
          keyword: result.keyword ? `${result.keyword}, ${keyword}` : keyword,
          data: {
            ...envelope.data,
            result: combinedResults,
          },
        })

        if (newResults.length > 0) {
          toast.success(`${newResults.length}개 상품이 추가되었습니다. (총 ${combinedResults.length}개)`)
        } else {
          toast.info('중복되지 않는 새 상품이 없습니다.')
        }
      } else {
        // 일반 모드: 새 결과로 덮어쓰기
        setResult({
          ...envelope,
          keyword,
          data: {
            ...envelope.data,
            result: filteredResults,
          },
        })
      }

      // 검색 완료 후 WING 검색 탭 닫기
      await new Promise(r => setTimeout(r, 1000))
      await pushToExtension({
        extensionId,
        payload: { type: 'CLOSE_SEARCH_TAB' },
      })
    })
  }

  const filtered = result?.data?.result ?? []

  // 전체 검증 함수
  const handleValidateAll = async () => {
    if (filtered.length === 0) {
      toast.error('검증할 상품이 없습니다.')
      return
    }

    setIsValidating(true)
    setValidationResults([])
    setValidationProgress({ current: 0, total: filtered.length })

    const results: ValidationResult[] = []

    for (let i = 0; i < filtered.length; i++) {
      const product = filtered[i]
      setValidationProgress({ current: i + 1, total: filtered.length })

      // 현재 검증 중인 상품으로 스크롤
      const productElement = productRefs.current.get(product.productId)
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      try {
        // 1단계: 드롭다운 옵션 존재 여부 확인 및 optionOrder 획득
        const optionPickerRes = await checkCoupangOptionPicker({
          extensionId,
          productId: product.productId,
          itemId: product.itemId,
          vendorItemId: product.vendorItemId,
        })

        // 드롭다운 옵션이 없으면 검증 실패
        if (!optionPickerRes.hasOptionPicker) {
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: 0,
            optionOrder: [],
            attributeValues: [],
            error: '드롭다운 옵션이 없습니다',
          })
          setValidationResults([...results])
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        // optionOrder의 첫 번째 아이템이 '수량', '용량', '길이', '개당 용량', '구성품'인 경우 검증 실패
        const optionOrder = optionPickerRes.optionOrder || []
        const firstOption = optionOrder.length > 0 ? optionOrder[0] : null
        const invalidFirstOptions = ['수량', '용량', '길이', '개당 용량', '구성품']
        const isFirstOptionInvalid = firstOption && invalidFirstOptions.includes(firstOption)

        if (isFirstOptionInvalid) {
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: [],
            error: `첫 번째 옵션이 ${firstOption}입니다`,
          })
          setValidationResults([...results])
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        // 2단계: Wing formV2 탭 열기 및 WING_ATTRIBUTE_CHECK로 attributeValues 추출
        let attributeValues: string[] = []
        let apiError: string | null = null

        try {
          const checkRes = await wingAttributeCheckViaExtension({
            extensionId,
            productId: product.productId,
            itemId: product.itemId,
            categoryId: product.categoryId,
            optionOrder: optionOrder,
          })

          console.log('[validate] ✅ wingAttributeCheckViaExtension response:', checkRes)
          console.log('[validate] Response status:', checkRes.status)
          console.log('[validate] Response data:', checkRes.data)
          console.log('[validate] Response data.ok:', checkRes.data?.ok)
          console.log('[validate] Response data.attributeValues:', checkRes.data?.attributeValues)
          console.log('[validate] Response data.attributeValues length:', checkRes.data?.attributeValues?.length)

          // API 호출이 실패했거나 응답이 없는 경우
          if (checkRes.status !== 'success') {
            console.error('[validate] ❌ API 호출 실패:', checkRes.status)
            apiError = `API 호출 실패: ${checkRes.status}`
          } else if (!checkRes.data?.ok) {
            console.error('[validate] ❌ API 응답 오류:', checkRes.data?.error)
            apiError = `API 응답 오류: ${checkRes.data?.error || 'Unknown error'}`
          } else if (!checkRes.data?.attributeValues) {
            console.error('[validate] ❌ attributeValues가 없습니다')
            apiError = 'attributeValues가 없습니다'
            attributeValues = []
          } else {
            attributeValues = checkRes.data.attributeValues || []
            console.log('[validate] ✅ Extracted attributeValues:', attributeValues)
            console.log('[validate] ✅ attributeValues length:', attributeValues.length)

            if (attributeValues.length === 0) {
              console.error('[validate] ❌ attributeValues 길이가 0입니다')
              apiError = '영어 또는 숫자로 시작하는 옵션 값이 없습니다'
            } else {
              console.log('[validate] ✅ attributeValues 검증 통과!')
            }
          }
        } catch (error) {
          console.error('[validate] Wing attribute check error:', error)
          apiError = `API 호출 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        }

        // formV2 탭 닫기 (검증 완료 후 정리)
        try {
          await closeFormV2Tab({ extensionId })
          console.log('[validate] ✅ Closed formV2 tab')
        } catch (error) {
          console.warn('[validate] ⚠️ Failed to close formV2 tab:', error)
        }

        // attributeValues 길이가 0일 때 검증 실패
        if (apiError || attributeValues.length === 0) {
          console.log('[validate] ❌ 검증 실패:', { apiError, attributeValuesLength: attributeValues.length })
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: [],
            error: apiError || '영어 또는 숫자로 시작하는 옵션 값이 없습니다',
          })
          setValidationResults([...results])
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        // 3단계: 로켓 배송 옵션 검증 (HAS_ROD, HAS_RETAIL, HAS_JIKGU)
        let rocketValidationError: string | null = null
        try {
          const itemsResponse = await wingProductItemsViaExtension({
            extensionId,
            productId: product.productId,
            itemId: product.itemId,
            categoryId: product.categoryId,
            allowSingleProduct: false,
          })

          console.log('[validate] ✅ wingProductItemsViaExtension response:', itemsResponse)

          if (itemsResponse.status === 'success' && itemsResponse.data) {
            const envelope = itemsResponse.data as any
            if (envelope.ok && envelope.data) {
              const productItemsDetail = envelope.data as WingProductItemsDetail
              const items = productItemsDetail.items || []

              console.log('[validate] 📦 Items count:', items.length)

              if (items.length === 0) {
                rocketValidationError = '옵션 데이터를 가져올 수 없습니다'
              } else {
                // HAS_ROD, HAS_RETAIL 또는 HAS_JIKGU가 true인 옵션 수 계산
                const rocketCount = items.filter(item => {
                  const controlFlags = item.controlFlags || {}
                  // 'true' 문자열 또는 boolean true 모두 체크
                  const hasRod = controlFlags?.['HAS_ROD'] === 'true' || controlFlags?.['HAS_ROD'] === true
                  const hasRetail = controlFlags?.['HAS_RETAIL'] === 'true' || controlFlags?.['HAS_RETAIL'] === true
                  const hasJikgu = controlFlags?.['HAS_JIKGU'] === 'true' || controlFlags?.['HAS_JIKGU'] === true
                  return hasRod || hasRetail || hasJikgu
                }).length

                console.log('[validate] 🚀 Rocket items count:', rocketCount, 'out of', items.length)

                // 로켓 배송 옵션이 하나도 없으면 검증 실패 (필수 조건)
                if (rocketCount === 0) {
                  console.log('[validate] ❌ 로켓 배송 옵션이 전혀 없습니다 - 검증 실패')
                  rocketValidationError = '로켓 배송 옵션이 없습니다'
                } else {
                  // 30% 초과 시 검증 실패
                  const rocketRatio = rocketCount / items.length
                  if (rocketRatio > 0.3) {
                    console.log('[validate] ❌ 로켓 배송 옵션이 너무 많습니다:', (rocketRatio * 100).toFixed(1) + '%')
                    rocketValidationError = `로켓 배송 옵션이 너무 많습니다 (${(rocketRatio * 100).toFixed(1)}%)`
                  } else {
                    console.log('[validate] ✅ 로켓 배송 옵션 비율 정상:', (rocketRatio * 100).toFixed(1) + '%')
                  }
                }
              }
            } else {
              rocketValidationError = '옵션 데이터 응답이 올바르지 않습니다'
            }
          } else {
            rocketValidationError = '옵션 데이터를 가져오지 못했습니다'
          }
        } catch (error) {
          console.error('[validate] Rocket validation error:', error)
          rocketValidationError = `옵션 검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        }

        // 로켓 배송 검증 실패 시
        if (rocketValidationError) {
          console.log('[validate] ❌ 로켓 배송 검증 실패:', rocketValidationError)
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: attributeValues,
            error: rocketValidationError,
          })
        } else {
          // 모든 검증 통과
          results.push({
            productId: product.productId,
            hasOptionPicker: true,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: attributeValues,
          })
        }
      } catch (error) {
        results.push({
          productId: product.productId,
          hasOptionPicker: false,
          optionCount: 0,
          optionOrder: [],
          attributeValues: [],
          error: String(error),
        })
      } finally {
        setValidationResults([...results])
      }

      // 요청 간 딜레이 (쿠팡 서버 부하 방지)
      await new Promise(r => setTimeout(r, 1000))
    }

    setValidationResults(results)
    setIsValidating(false)

    const withOptions = results.filter(r => r.hasOptionPicker).length
    toast.success(`검증 완료: 옵션 있음 ${withOptions}개 / 없음 ${results.length - withOptions}개`)
  }

  // 개별 상품 검증 함수
  const handleValidateProduct = async (product: WingProductSummary) => {
    // 이미 검증 중인 상품이면 중단
    if (validatingProductIds.has(product.productId)) {
      return
    }

    setValidatingProductIds(prev => new Set(prev).add(product.productId))

    try {
      // 현재 검증 중인 상품으로 스크롤
      const productElement = productRefs.current.get(product.productId)
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      // 기존 검증 결과 제거 (해당 상품만)
      setValidationResults(prev => prev.filter(r => r.productId !== product.productId))

      let validationResult: ValidationResult | null = null

      try {
        // 1단계: 드롭다운 옵션 존재 여부 확인 및 optionOrder 획득
        const optionPickerRes = await checkCoupangOptionPicker({
          extensionId,
          productId: product.productId,
          itemId: product.itemId,
          vendorItemId: product.vendorItemId,
        })

        // 드롭다운 옵션이 없으면 검증 실패
        if (!optionPickerRes.hasOptionPicker) {
          validationResult = {
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: 0,
            optionOrder: [],
            attributeValues: [],
            error: '드롭다운 옵션이 없습니다',
          }
          setValidationResults(prev => [...prev.filter(r => r.productId !== product.productId), validationResult!])
          return
        }

        // optionOrder의 첫 번째 아이템이 '수량', '용량', '길이', '개당 용량', '구성품'인 경우 검증 실패
        const optionOrder = optionPickerRes.optionOrder || []
        const firstOption = optionOrder.length > 0 ? optionOrder[0] : null
        const invalidFirstOptions = ['수량', '용량', '길이', '개당 용량', '구성품']
        const isFirstOptionInvalid = firstOption && invalidFirstOptions.includes(firstOption)

        if (isFirstOptionInvalid) {
          validationResult = {
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: [],
            error: `첫 번째 옵션이 ${firstOption}입니다`,
          }
          setValidationResults(prev => [...prev.filter(r => r.productId !== product.productId), validationResult!])
          return
        }

        // 2단계: Wing formV2 탭 열기 및 WING_ATTRIBUTE_CHECK로 attributeValues 추출
        let attributeValues: string[] = []
        let apiError: string | null = null

        try {
          const checkRes = await wingAttributeCheckViaExtension({
            extensionId,
            productId: product.productId,
            itemId: product.itemId,
            categoryId: product.categoryId,
            optionOrder: optionOrder,
          })

          // API 호출이 실패했거나 응답이 없는 경우
          if (checkRes.status !== 'success') {
            apiError = `API 호출 실패: ${checkRes.status}`
          } else if (!checkRes.data?.ok) {
            apiError = `API 응답 오류: ${checkRes.data?.error || 'Unknown error'}`
          } else if (!checkRes.data?.attributeValues) {
            apiError = 'attributeValues가 없습니다'
            attributeValues = []
          } else {
            attributeValues = checkRes.data.attributeValues || []

            if (attributeValues.length === 0) {
              apiError = '영어 또는 숫자로 시작하는 옵션 값이 없습니다'
            }
          }
        } catch (error) {
          apiError = `API 호출 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        }

        // formV2 탭 닫기 (검증 완료 후 정리)
        try {
          await closeFormV2Tab({ extensionId })
        } catch (error) {
          console.warn('[validate] ⚠️ Failed to close formV2 tab:', error)
        }

        // attributeValues 길이가 0일 때 검증 실패
        if (apiError || attributeValues.length === 0) {
          validationResult = {
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: [],
            error: apiError || '영어 또는 숫자로 시작하는 옵션 값이 없습니다',
          }
          setValidationResults(prev => [...prev.filter(r => r.productId !== product.productId), validationResult!])
          return
        }

        // 3단계: 로켓 배송 옵션 검증 (HAS_ROD, HAS_RETAIL, HAS_JIKGU)
        let rocketValidationError: string | null = null
        try {
          const itemsResponse = await wingProductItemsViaExtension({
            extensionId,
            productId: product.productId,
            itemId: product.itemId,
            categoryId: product.categoryId,
            allowSingleProduct: false,
          })

          if (itemsResponse.status === 'success' && itemsResponse.data) {
            const envelope = itemsResponse.data as any
            if (envelope.ok && envelope.data) {
              const productItemsDetail = envelope.data as WingProductItemsDetail
              const items = productItemsDetail.items || []

              if (items.length === 0) {
                rocketValidationError = '옵션 데이터를 가져올 수 없습니다'
              } else {
                // HAS_ROD, HAS_RETAIL 또는 HAS_JIKGU가 true인 옵션 수 계산
                const rocketCount = items.filter(item => {
                  const controlFlags = item.controlFlags || {}
                  // 'true' 문자열 또는 boolean true 모두 체크
                  const hasRod = controlFlags?.['HAS_ROD'] === 'true' || controlFlags?.['HAS_ROD'] === true
                  const hasRetail = controlFlags?.['HAS_RETAIL'] === 'true' || controlFlags?.['HAS_RETAIL'] === true
                  const hasJikgu = controlFlags?.['HAS_JIKGU'] === 'true' || controlFlags?.['HAS_JIKGU'] === true
                  return hasRod || hasRetail || hasJikgu
                }).length

                console.log('[validate] 🚀 Rocket items count:', rocketCount, 'out of', items.length)

                // 로켓 배송 옵션이 하나도 없으면 검증 실패 (필수 조건)
                if (rocketCount === 0) {
                  console.log('[validate] ❌ 로켓 배송 옵션이 전혀 없습니다 - 검증 실패')
                  rocketValidationError = '로켓 배송 옵션이 없습니다'
                } else {
                  // 30% 초과 시 검증 실패
                  const rocketRatio = rocketCount / items.length
                  if (rocketRatio > 0.3) {
                    console.log('[validate] ❌ 로켓 배송 옵션이 너무 많습니다:', (rocketRatio * 100).toFixed(1) + '%')
                    rocketValidationError = `로켓 배송 옵션이 너무 많습니다 (${(rocketRatio * 100).toFixed(1)}%)`
                  } else {
                    console.log('[validate] ✅ 로켓 배송 옵션 비율 정상:', (rocketRatio * 100).toFixed(1) + '%')
                  }
                }
              }
            } else {
              rocketValidationError = '옵션 데이터 응답이 올바르지 않습니다'
            }
          } else {
            rocketValidationError = '옵션 데이터를 가져오지 못했습니다'
          }
        } catch (error) {
          rocketValidationError = `옵션 검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        }

        // 로켓 배송 검증 실패 시
        if (rocketValidationError) {
          validationResult = {
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: attributeValues,
            error: rocketValidationError,
          }
        } else {
          // 모든 검증 통과
          validationResult = {
            productId: product.productId,
            hasOptionPicker: true,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: attributeValues,
          }
        }
      } catch (error) {
        validationResult = {
          productId: product.productId,
          hasOptionPicker: false,
          optionCount: 0,
          optionOrder: [],
          attributeValues: [],
          error: String(error),
        }
      }

      // 검증 결과 업데이트
      if (validationResult) {
        setValidationResults(prev => [...prev.filter(r => r.productId !== product.productId), validationResult!])
        toast.success(`${product.productName} 검증 완료`)
      }
    } finally {
      setValidatingProductIds(prev => {
        const next = new Set(prev)
        next.delete(product.productId)
        return next
      })
    }
  }

  // 전체 검증 후 저장 함수
  const handleValidateAndSave = async () => {
    if (filtered.length === 0) {
      toast.error('검증할 상품이 없습니다.')
      return
    }

    setIsValidatingAndSaving(true)
    setValidationResults([])
    setValidationProgress({ current: 0, total: filtered.length })

    const results: ValidationResult[] = []

    // 1단계: 전체 검증
    for (let i = 0; i < filtered.length; i++) {
      const product = filtered[i]
      setValidationProgress({ current: i + 1, total: filtered.length })

      // 현재 검증 중인 상품으로 스크롤
      const productElement = productRefs.current.get(product.productId)
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      try {
        // 1단계: 드롭다운 옵션 존재 여부 확인 및 optionOrder 획득
        const optionPickerRes = await checkCoupangOptionPicker({
          extensionId,
          productId: product.productId,
          itemId: product.itemId,
          vendorItemId: product.vendorItemId,
        })

        // 드롭다운 옵션이 없으면 검증 실패
        if (!optionPickerRes.hasOptionPicker) {
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: 0,
            optionOrder: [],
            attributeValues: [],
            error: '드롭다운 옵션이 없습니다',
          })
          setValidationResults([...results])
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        // optionOrder의 첫 번째 아이템이 '수량', '용량', '길이', '개당 용량', '구성품'인 경우 검증 실패
        const optionOrder = optionPickerRes.optionOrder || []
        const firstOption = optionOrder.length > 0 ? optionOrder[0] : null
        const invalidFirstOptions = ['수량', '용량', '길이', '개당 용량', '구성품']
        const isFirstOptionInvalid = firstOption && invalidFirstOptions.includes(firstOption)

        if (isFirstOptionInvalid) {
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: [],
            error: `첫 번째 옵션이 ${firstOption}입니다`,
          })
          setValidationResults([...results])
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        // 2단계: Wing formV2 탭 열기 및 WING_ATTRIBUTE_CHECK로 attributeValues 추출
        let attributeValues: string[] = []
        let apiError: string | null = null

        try {
          const checkRes = await wingAttributeCheckViaExtension({
            extensionId,
            productId: product.productId,
            itemId: product.itemId,
            categoryId: product.categoryId,
            optionOrder: optionOrder,
          })

          console.log('[validate] ✅ wingAttributeCheckViaExtension response:', checkRes)
          console.log('[validate] Response status:', checkRes.status)
          console.log('[validate] Response data:', checkRes.data)
          console.log('[validate] Response data.ok:', checkRes.data?.ok)
          console.log('[validate] Response data.attributeValues:', checkRes.data?.attributeValues)
          console.log('[validate] Response data.attributeValues length:', checkRes.data?.attributeValues?.length)

          // API 호출이 실패했거나 응답이 없는 경우
          if (checkRes.status !== 'success') {
            console.error('[validate] ❌ API 호출 실패:', checkRes.status)
            apiError = `API 호출 실패: ${checkRes.status}`
          } else if (!checkRes.data?.ok) {
            console.error('[validate] ❌ API 응답 오류:', checkRes.data?.error)
            apiError = `API 응답 오류: ${checkRes.data?.error || 'Unknown error'}`
          } else if (!checkRes.data?.attributeValues) {
            console.error('[validate] ❌ attributeValues가 없습니다')
            apiError = 'attributeValues가 없습니다'
            attributeValues = []
          } else {
            attributeValues = checkRes.data.attributeValues || []
            console.log('[validate] ✅ Extracted attributeValues:', attributeValues)
            console.log('[validate] ✅ attributeValues length:', attributeValues.length)

            if (attributeValues.length === 0) {
              console.error('[validate] ❌ attributeValues 길이가 0입니다')
              apiError = '영어 또는 숫자로 시작하는 옵션 값이 없습니다'
            } else {
              console.log('[validate] ✅ attributeValues 검증 통과!')
            }
          }
        } catch (error) {
          console.error('[validate] Wing attribute check error:', error)
          apiError = `API 호출 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        }

        // formV2 탭 닫기 (검증 완료 후 정리)
        try {
          await closeFormV2Tab({ extensionId })
          console.log('[validate] ✅ Closed formV2 tab')
        } catch (error) {
          console.warn('[validate] ⚠️ Failed to close formV2 tab:', error)
        }

        // attributeValues 길이가 0일 때 검증 실패
        if (apiError || attributeValues.length === 0) {
          console.log('[validate] ❌ 검증 실패:', { apiError, attributeValuesLength: attributeValues.length })
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: [],
            error: apiError || '영어 또는 숫자로 시작하는 옵션 값이 없습니다',
          })
          setValidationResults([...results])
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        // 3단계: 로켓 배송 옵션 검증 (HAS_ROD, HAS_RETAIL, HAS_JIKGU)
        let rocketValidationError: string | null = null
        try {
          const itemsResponse = await wingProductItemsViaExtension({
            extensionId,
            productId: product.productId,
            itemId: product.itemId,
            categoryId: product.categoryId,
            allowSingleProduct: false,
          })

          console.log('[validate] ✅ wingProductItemsViaExtension response:', itemsResponse)

          if (itemsResponse.status === 'success' && itemsResponse.data) {
            const envelope = itemsResponse.data as any
            if (envelope.ok && envelope.data) {
              const productItemsDetail = envelope.data as WingProductItemsDetail
              const items = productItemsDetail.items || []

              console.log('[validate] 📦 Items count:', items.length)

              if (items.length === 0) {
                rocketValidationError = '옵션 데이터를 가져올 수 없습니다'
              } else {
                // HAS_ROD, HAS_RETAIL 또는 HAS_JIKGU가 true인 옵션 수 계산
                const rocketCount = items.filter(item => {
                  const controlFlags = item.controlFlags || {}
                  // 'true' 문자열 또는 boolean true 모두 체크
                  const hasRod = controlFlags?.['HAS_ROD'] === 'true' || controlFlags?.['HAS_ROD'] === true
                  const hasRetail = controlFlags?.['HAS_RETAIL'] === 'true' || controlFlags?.['HAS_RETAIL'] === true
                  const hasJikgu = controlFlags?.['HAS_JIKGU'] === 'true' || controlFlags?.['HAS_JIKGU'] === true
                  return hasRod || hasRetail || hasJikgu
                }).length

                console.log('[validate] 🚀 Rocket items count:', rocketCount, 'out of', items.length)

                // 로켓 배송 옵션이 하나도 없으면 검증 실패 (필수 조건)
                if (rocketCount === 0) {
                  console.log('[validate] ❌ 로켓 배송 옵션이 전혀 없습니다 - 검증 실패')
                  rocketValidationError = '로켓 배송 옵션이 없습니다'
                } else {
                  // 30% 초과 시 검증 실패
                  const rocketRatio = rocketCount / items.length
                  if (rocketRatio > 0.3) {
                    console.log('[validate] ❌ 로켓 배송 옵션이 너무 많습니다:', (rocketRatio * 100).toFixed(1) + '%')
                    rocketValidationError = `로켓 배송 옵션이 너무 많습니다 (${(rocketRatio * 100).toFixed(1)}%)`
                  } else {
                    console.log('[validate] ✅ 로켓 배송 옵션 비율 정상:', (rocketRatio * 100).toFixed(1) + '%')
                  }
                }
              }
            } else {
              rocketValidationError = '옵션 데이터 응답이 올바르지 않습니다'
            }
          } else {
            rocketValidationError = '옵션 데이터를 가져오지 못했습니다'
          }
        } catch (error) {
          console.error('[validate] Rocket validation error:', error)
          rocketValidationError = `옵션 검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        }

        // 로켓 배송 검증 실패 시
        if (rocketValidationError) {
          console.log('[validate] ❌ 로켓 배송 검증 실패:', rocketValidationError)
          results.push({
            productId: product.productId,
            hasOptionPicker: false,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: attributeValues,
            error: rocketValidationError,
          })
        } else {
          // 모든 검증 통과
          results.push({
            productId: product.productId,
            hasOptionPicker: true,
            optionCount: optionPickerRes.optionCount || 0,
            optionOrder: optionOrder,
            attributeValues: attributeValues,
          })
        }
      } catch (error) {
        results.push({
          productId: product.productId,
          hasOptionPicker: false,
          optionCount: 0,
          optionOrder: [],
          attributeValues: [],
          error: String(error),
        })
      } finally {
        setValidationResults([...results])
      }

      // 요청 간 딜레이
      await new Promise(r => setTimeout(r, 1000))
    }

    // 2단계: 옵션이 있는 상품만 필터링하여 저장 (optionOrder, attributeValues 포함)
    const productsToSave = filtered
      .filter(product => {
        const validationResult = results.find(r => r.productId === product.productId)
        return validationResult?.hasOptionPicker && !validationResult?.error
      })
      .map(product => {
        const validationResult = results.find(r => r.productId === product.productId)
        return {
          ...product,
          optionOrder: validationResult?.optionOrder || [],
          attributeValues: validationResult?.attributeValues || [],
        }
      })

    if (productsToSave.length === 0) {
      toast.warning('저장할 상품이 없습니다. (옵션이 있는 상품이 없음)')
      setIsValidatingAndSaving(false)
      return
    }

    // 3단계: 일괄 저장
    await createProductsBulkMutation.mutateAsync(productsToSave)

    // 저장된 상품 ID를 savedProducts Set에 추가
    const savedProductIds = productsToSave.map(p => p.productId.toString())
    setSavedProducts(prev => new Set([...prev, ...savedProductIds]))

    setIsValidatingAndSaving(false)
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* 검색 폼 */}
        <div className="flex w-full flex-col gap-3">
          <form className="flex w-full items-center gap-3" onSubmit={onSubmit}>
            <Input
              placeholder="키워드를 입력하세요"
              className="flex-1"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Switch id="bulk-mode" checked={isBulkMode} onCheckedChange={setIsBulkMode} />
              <Label htmlFor="bulk-mode" className="cursor-pointer text-sm font-medium">
                벌크 모드
              </Label>
            </div>
            {isBulkMode && filtered.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null)
                  setValidationResults([])
                  setSavedProducts(new Set())
                  toast.info('검색 결과가 초기화되었습니다.')
                }}>
                초기화
              </Button>
            )}
            <Button type="submit" className="shrink-0" disabled={isPending || !keyword.trim()}>
              {isPending ? '검색 중...' : '검색'}
            </Button>
          </form>
          {isBulkMode && (
            <p className="text-muted-foreground text-sm">
              ℹ️ 벌크 모드: 검색 결과가 누적됩니다. 다른 키워드로 추가 검색 가능합니다.
            </p>
          )}
        </div>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

        {result && <div></div>}

        {result && (
          <Collapsible open={isJsonOpen} onOpenChange={setIsJsonOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border p-4">
              {isJsonOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <h2 className="text-lg font-semibold">크롤링 데이터 (Raw JSON)</h2>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="max-h-96 overflow-auto rounded-lg border p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 검색 결과 */}
        {filtered.length > 0 && (
          <div>
            <div className="border-border bg-background/95 sticky top-0 z-10 mb-4 flex items-center justify-between rounded-lg border p-4 backdrop-blur-sm">
              <div>
                <h2 className="text-foreground text-xl font-bold">
                  검색 결과 ({isBulkMode ? '총' : '상위'} {filtered.length}개)
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {isBulkMode ? (
                    <>🔄 벌크 모드: 검색 결과 누적 중 • 국내배송, 경쟁상품 {MIN_ITEM_COUNT_OF_PRODUCT}개 이상</>
                  ) : (
                    <>국내배송, 경쟁상품 {MIN_ITEM_COUNT_OF_PRODUCT}개 이상, 최대 20개까지 표시</>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleValidateAll}
                  disabled={isValidating || isValidatingAndSaving}
                  variant="outline"
                  className="gap-2">
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      검증 중... ({validationProgress.current}/{validationProgress.total})
                    </>
                  ) : (
                    '전체 검증'
                  )}
                </Button>
                <Button
                  onClick={handleValidateAndSave}
                  disabled={isValidating || isValidatingAndSaving || createProductsBulkMutation.isPending}
                  variant="default"
                  className="gap-2">
                  {isValidatingAndSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {createProductsBulkMutation.isPending
                        ? '저장 중...'
                        : `검증 중... (${validationProgress.current}/${validationProgress.total})`}
                    </>
                  ) : (
                    '전체 검증 후 저장'
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filtered.map(product => {
                const validationResult = validationResults.find(r => r.productId === product.productId)
                return (
                  <ProductCard
                    key={product.productId}
                    ref={el => {
                      if (el) {
                        productRefs.current.set(product.productId, el)
                      } else {
                        productRefs.current.delete(product.productId)
                      }
                    }}
                    product={product}
                    extensionId={extensionId}
                    onSave={product => {
                      const productWithOptionOrder = {
                        ...product,
                        optionOrder: validationResult?.optionOrder || [],
                        attributeValues: validationResult?.attributeValues || [],
                      }
                      createProductMutation.mutate(productWithOptionOrder)
                    }}
                    isSaving={createProductMutation.isPending}
                    isSaved={savedProducts.has(product.productId.toString())}
                    validationResult={
                      validationResult
                        ? {
                            hasOptionPicker: validationResult.hasOptionPicker,
                            optionCount: validationResult.optionCount,
                            optionOrder: validationResult.optionOrder,
                            attributeValues: validationResult.attributeValues,
                            error: validationResult.error,
                          }
                        : undefined
                    }
                    onValidate={() => handleValidateProduct(product)}
                    isValidating={validatingProductIds.has(product.productId)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
