'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { BarChart3, Edit3, ArrowDown, ArrowLeft } from 'lucide-react'
import { getHierarchicalCategories } from '@/serverActions/analyze/category.actions'
import CategorySelector from '../../(_components)/CategorySelector'
import {
  getDataLabKeywords,
  getDataLabKeywordsByPage,
  fetchDataLabKeywordsSinglePage,
} from '@/serverActions/analyze/datalab-direct.actions'

interface CategoryNode {
  id: bigint
  name: string
  level: number
  children?: CategoryNode[]
}

interface ItemExplorationPageProps {
  initialCategoryId: string
  initialSearchParams?: {
    period?: 'daily' | 'weekly'
    gender?: 'all' | 'f' | 'm'
    age?: string
  }
}

export default function ItemExplorationPage({ initialCategoryId, initialSearchParams = {} }: ItemExplorationPageProps) {
  // Next.js 훅들
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()

  // URL에서 카테고리 ID 가져오기
  const categoryId = (params.categoryId as string) || initialCategoryId

  // 상태 관리
  const [selectedCategory1, setSelectedCategory1] = useState<CategoryNode | null>(null)
  const [selectedCategory2, setSelectedCategory2] = useState<CategoryNode | null>(null)
  const [selectedCategory3, setSelectedCategory3] = useState<CategoryNode | null>(null)
  const [selectedCategory4, setSelectedCategory4] = useState<CategoryNode | null>(null)
  const [isDirectInputMode, setIsDirectInputMode] = useState(false)
  const [directInputValue, setDirectInputValue] = useState('')
  const [trendData, setTrendData] = useState<any>(null)
  const [isLoadingDB, setIsLoadingDB] = useState(false)
  const [isFetchingDataLab, setIsFetchingDataLab] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [allKeywords, setAllKeywords] = useState<any[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 사용자 커스텀 설정 (URL에서 초기값 가져오기)
  const [selectedGender, setSelectedGender] = useState<'all' | 'f' | 'm'>(
    initialSearchParams.gender || (searchParams.get('gender') as 'all' | 'f' | 'm') || 'all',
  )
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    initialSearchParams.age?.split(',').filter(Boolean) || searchParams.get('age')?.split(',').filter(Boolean) || [],
  )
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>(
    initialSearchParams.period || (searchParams.get('period') as 'daily' | 'weekly') || 'daily',
  )
  const [isChangingSettings, setIsChangingSettings] = useState(false)

  // URL 업데이트 함수
  const updateURL = useCallback(
    (updates: Record<string, string | undefined>) => {
      const current = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          current.set(key, value)
        } else {
          current.delete(key)
        }
      })

      const newUrl = `${window.location.pathname}?${current.toString()}`
      router.replace(newUrl, { scroll: false })
    },
    [searchParams, router],
  )

  // 연령대 선택 핸들러 (복수 선택 가능) - URL 업데이트 추가
  const handleAgeGroupToggle = (ageGroup: string) => {
    setSelectedAgeGroups(prev => {
      const newAgeGroups = prev.includes(ageGroup) ? prev.filter(age => age !== ageGroup) : [...prev, ageGroup]

      console.log(`📊 연령대 상태 변화:`, {
        이전: prev,
        클릭한연령대: ageGroup,
        새로운상태: newAgeGroups,
        payload형태: newAgeGroups.join(',') || '전체',
      })

      // URL 업데이트
      updateURL({ age: newAgeGroups.length > 0 ? newAgeGroups.join(',') : undefined })

      return newAgeGroups
    })
  }

  // 성별 상태 변화 추적 - URL 업데이트 추가
  useEffect(() => {
    console.log(`📊 성별 상태 변화:`, {
      selectedGender,
      payload형태: selectedGender === 'all' ? '' : selectedGender,
    })
    // 성별 변경 시 URL 업데이트
    updateURL({ gender: selectedGender === 'all' ? undefined : selectedGender })
  }, [selectedGender, updateURL])

  // 연령대 상태 변화 추적
  useEffect(() => {
    console.log(`📊 연령대 상태 변화:`, {
      selectedAgeGroups,
      payload형태: selectedAgeGroups.length === 0 ? '' : selectedAgeGroups.join(','),
    })
  }, [selectedAgeGroups])

  // 계층적 카테고리 조회
  const { data: categoryData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['hierarchicalCategories'],
    queryFn: getHierarchicalCategories,
    staleTime: 10 * 60 * 1000, // 10분간 캐시
  })

  // URL에서 카테고리 정보 찾기
  const findCategoryById = useCallback((cats: CategoryNode[], id: string): CategoryNode | null => {
    for (const cat of cats) {
      if (cat.id.toString() === id) return cat
      if (cat.children) {
        const found = findCategoryById(cat.children, id)
        if (found) return found
      }
    }
    return null
  }, [])

  // 초기 데이터 로드 (URL 기반 카테고리)
  useEffect(() => {
    if (categoryData?.level1 && categoryId && currentCategoryName && currentCategoryName !== '알 수 없는 카테고리') {
      fetchInitialData(currentCategoryName)
    }
  }, [categoryData, categoryId])

  // 현재 선택된 카테고리명 (URL 기반 우선)
  const currentCategory = categoryData?.level1 ? findCategoryById(categoryData.level1, categoryId) : null
  const currentCategoryName =
    currentCategory?.name ||
    selectedCategory4?.name ||
    selectedCategory3?.name ||
    selectedCategory2?.name ||
    selectedCategory1?.name ||
    directInputValue ||
    '전체'
  const isCategorySelected = currentCategoryName !== '전체'

  // 카테고리 ID 조회
  const findCategoryId = useCallback(
    (categoryName: string): string | null => {
      const findInCategories = (categories: CategoryNode[], name: string): string | null => {
        for (const category of categories) {
          if (category.name === name) return category.id.toString()
          if (category.children) {
            const found = findInCategories(category.children, name)
            if (found) return found
          }
        }
        return null
      }

      const categoryId = categoryData ? findInCategories(categoryData.level1, categoryName) : null
      return categoryId
    },
    [categoryData],
  )

  // DB 데이터 확인
  const checkDbData = useCallback(
    async (categoryName: string, page: number) => {
      const periodType = selectedPeriod === 'weekly' ? 'WEEKLY' : 'DAILY'
      const genderParam = selectedGender === 'all' ? '' : selectedGender
      const ageGroupParam = selectedAgeGroups.length === 0 ? '' : selectedAgeGroups.join(',')

      const result = await getDataLabKeywordsByPage(categoryName, periodType, page, genderParam, ageGroupParam)
      return result
    },
    [selectedPeriod, selectedGender, selectedAgeGroups],
  )

  // 데이터랩에서 페칭
  const fetchFromDataLab = useCallback(
    async (categoryId: string, categoryName: string, page: number) => {
      const request = {
        categoryId,
        categoryName,
        timeUnit: (selectedPeriod === 'weekly' ? 'week' : 'date') as 'date' | 'week' | 'month',
        maxPages: 1,
        startPage: page,
        endPage: page,
        device: 'all' as 'all' | 'pc' | 'mo' | '',
        gender: (selectedGender === 'all' ? '' : selectedGender) as '' | 'all' | 'm' | 'f',
        ageGroup: selectedAgeGroups.length === 0 ? '' : selectedAgeGroups.join(','),
      }

      console.log(`📤 DataLab 요청 Payload:`, {
        categoryName,
        page,
        gender: request.gender,
        ageGroup: request.ageGroup,
        timeUnit: request.timeUnit,
      })

      console.log(`📊 현재 상태값:`, {
        selectedGender,
        selectedAgeGroups,
        selectedPeriod,
      })

      const result = await fetchDataLabKeywordsSinglePage(request)
      return result
    },
    [selectedPeriod, selectedGender, selectedAgeGroups],
  )

  // 데이터 병합
  const mergeData = useCallback((newData: any, isInitialLoad: boolean, categoryName: string) => {
    if (isInitialLoad) {
      const formattedData = {
        categoryName,
        keywords: newData,
        totalKeywords: newData.length,
        collectedAt: new Date().toISOString(),
      }
      setTrendData(formattedData)
      setAllKeywords(newData)
    } else {
      setAllKeywords(prev => [...prev, ...newData])
      setTrendData(prev => ({
        ...prev,
        keywords: [...(prev?.keywords || []), ...newData],
        totalKeywords: (prev?.totalKeywords || 0) + newData.length,
      }))
    }
  }, [])

  // 메인 페이지 데이터 처리 함수
  const fetchPageData = useCallback(
    async (categoryName: string, page: number, isInitialLoad = false) => {
      if (!categoryName || categoryName === '전체') {
        return
      }

      try {
        // 1. 카테고리 ID 조회
        const categoryId = findCategoryId(categoryName)
        if (!categoryId) {
          return
        }

        // 2. DB 데이터 확인
        const dataLabResult = await checkDbData(categoryName, page)

        // 3. DB에 신선한 데이터가 있는지 확인
        if (dataLabResult?.success && dataLabResult.data?.keywords?.length > 0) {
          const dataAge = Date.now() - new Date(dataLabResult.data.collectedAt).getTime()
          const isDataFresh = dataAge < 24 * 60 * 60 * 1000

          if (isDataFresh) {
            mergeData(dataLabResult.data.keywords, isInitialLoad, categoryName)
            if (page >= 25) {
              setHasMorePages(false)
            }
            return
          }
        }

        // 4. 데이터랩에서 페칭 필요
        if (isInitialLoad) {
          setIsFetchingDataLab(true)
        } else {
          setIsLoadingMore(true)
        }

        try {
          const fetchResult = await fetchFromDataLab(categoryId, categoryName, page)

          if (fetchResult?.success && fetchResult.data?.length > 0) {
            setFetchError(null)
            mergeData(fetchResult.data, isInitialLoad, categoryName)
            console.log(`✅ fetchPageData 완료: 데이터랩에서 ${fetchResult.data.length}개 키워드 페칭`)
          } else {
            if (page >= 25) {
              setHasMorePages(false)
            }
          }
        } catch (fetchError) {
          const errorMessage = `페이지 ${page} 데이터 페칭에 실패했습니다: ${fetchError instanceof Error ? fetchError.message : '알 수 없는 오류'}`
          setFetchError(errorMessage)

          if (page >= 25) {
            setHasMorePages(false)
          }
        } finally {
          if (isInitialLoad) {
            setIsFetchingDataLab(false)
          } else {
            setIsLoadingMore(false)
          }
        }
      } catch (error) {
        if (!isInitialLoad) {
          setIsLoadingMore(false)
        }
        console.log(`❌ fetchPageData 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      }
    },
    [findCategoryId, checkDbData, fetchFromDataLab, mergeData],
  )

  // 초기 데이터 로드 (1페이지)
  const fetchInitialData = useCallback(
    async (categoryName: string) => {
      if (!categoryName || categoryName === '전체') return

      setIsLoadingDB(true)
      setCurrentPage(1)
      setHasMorePages(true)
      setAllKeywords([])
      setTrendData(null)

      try {
        await fetchPageData(categoryName, 1, true)
      } finally {
        setIsLoadingDB(false)
      }
    },
    [fetchPageData],
  )

  // 성별/연령대 설정 변경 시 데이터 다시 로드 (debounce 적용)
  useEffect(() => {
    if (currentCategoryName && currentCategoryName !== '전체') {
      console.log(`🔄 설정 변경 감지, 0.5초 후 데이터 다시 로드 예정`)
      setIsChangingSettings(true)

      // 0.5초 debounce - 빠른 연속 클릭 방지
      const debounceTimer = setTimeout(async () => {
        console.log(`🚀 설정 변경 debounce 완료, 데이터 다시 로드 시작`)
        setTrendData(null)
        setAllKeywords([])
        setCurrentPage(1)
        setHasMorePages(true)
        setIsLoadingMore(false)

        try {
          await fetchInitialData(currentCategoryName)
        } finally {
          setIsChangingSettings(false)
        }
      }, 500)

      return () => {
        console.log(`🗑️ 설정 변경 debounce 취소`)
        clearTimeout(debounceTimer)
        setIsChangingSettings(false)
      }
    }
  }, [selectedGender, selectedAgeGroups, fetchInitialData])

  // 추가 페이지 로드 (무한 스크롤)
  const loadMoreData = useCallback(
    async (categoryName: string) => {
      if (!hasMorePages || isLoadingMore) {
        return
      }

      setTimeout(async () => {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        setIsLoadingMore(true)

        try {
          await fetchPageData(categoryName, nextPage, false)
        } catch (error) {
          // 에러 처리는 fetchPageData 내부에서 처리
        } finally {
          setIsLoadingMore(false)
        }
      }, 200)
    },
    [hasMorePages, isLoadingMore, isChangingSettings, currentPage, fetchPageData],
  )

  // 무한 스크롤을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]

        if (entry.isIntersecting && hasMorePages && !isLoadingMore && currentCategoryName !== '전체') {
          loadMoreData(currentCategoryName)
        }
      },
      {
        threshold: 0.5, // 50% 보이면 트리거 (더 엄격하게)
        rootMargin: '50px', // 50px 전에 미리 트리거 (더 가깝게)
      },
    )

    // DOM 업데이트를 기다린 후 요소 찾기
    const findAndObserve = () => {
      const loadMoreElement = document.getElementById('load-more-trigger')

      if (loadMoreElement) {
        observer.observe(loadMoreElement)
        return true
      }
      return false
    }

    // 즉시 시도
    if (!findAndObserve()) {
      // 실패하면 MutationObserver로 DOM 변경 감지
      const mutationObserver = new MutationObserver(() => {
        if (findAndObserve()) {
          mutationObserver.disconnect()
        }
      })

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })

      // 5초 후 타임아웃
      const timeout = setTimeout(() => {
        mutationObserver.disconnect()
      }, 5000)

      return () => {
        clearTimeout(timeout)
        mutationObserver.disconnect()
        observer.disconnect()
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [hasMorePages, isLoadingMore, isChangingSettings, currentCategoryName, loadMoreData])

  // CategorySelector 핸들러
  const handleCategoryChange = useCallback(
    (categoryId: string | null, categoryName: string) => {
      // currentCategoryName 업데이트
      if (categoryId === null || categoryId === 'all') {
        // 전체 선택
        setSelectedCategory1(null)
        setSelectedCategory2(null)
        setSelectedCategory3(null)
        setSelectedCategory4(null)
      } else {
        // 특정 카테고리 선택 - categoryId를 기반으로 카테고리 찾기
        const findCategoryById = (categories: CategoryNode[], id: string): CategoryNode | null => {
          for (const category of categories) {
            if (category.id.toString() === id) return category
            if (category.children) {
              const found = findCategoryById(category.children, id)
              if (found) return found
            }
          }
          return null
        }

        if (categoryData) {
          const foundCategory = findCategoryById(categoryData.level1, categoryId)
          if (foundCategory) {
            // 카테고리 레벨에 따라 설정
            if (foundCategory.level === 1) {
              setSelectedCategory1(foundCategory)
              setSelectedCategory2(null)
              setSelectedCategory3(null)
              setSelectedCategory4(null)
            } else if (foundCategory.level === 2) {
              const parent1 = categoryData.level1.find(cat =>
                cat.children?.some(child => child.id === foundCategory.id),
              )
              if (parent1) {
                setSelectedCategory1(parent1)
                setSelectedCategory2(foundCategory)
                setSelectedCategory3(null)
                setSelectedCategory4(null)
              }
            } else if (foundCategory.level === 3) {
              const parent1 = categoryData.level1.find(cat =>
                cat.children?.some(child => child.children?.some(grandChild => grandChild.id === foundCategory.id)),
              )
              const parent2 = parent1?.children?.find(child =>
                child.children?.some(grandChild => grandChild.id === foundCategory.id),
              )
              if (parent1 && parent2) {
                setSelectedCategory1(parent1)
                setSelectedCategory2(parent2)
                setSelectedCategory3(foundCategory)
                setSelectedCategory4(null)
              }
            } else if (foundCategory.level === 4) {
              const parent1 = categoryData.level1.find(cat =>
                cat.children?.some(child =>
                  child.children?.some(grandChild =>
                    grandChild.children?.some(greatGrandChild => greatGrandChild.id === foundCategory.id),
                  ),
                ),
              )
              const parent2 = parent1?.children?.find(child =>
                child.children?.some(grandChild =>
                  grandChild.children?.some(greatGrandChild => greatGrandChild.id === foundCategory.id),
                ),
              )
              const parent3 = parent2?.children?.find(grandChild =>
                grandChild.children?.some(greatGrandChild => greatGrandChild.id === foundCategory.id),
              )
              if (parent1 && parent2 && parent3) {
                setSelectedCategory1(parent1)
                setSelectedCategory2(parent2)
                setSelectedCategory3(parent3)
                setSelectedCategory4(foundCategory)
              }
            }
          }
        }
      }

      // 카테고리 변경 시 URL 업데이트
      if (categoryId && categoryId !== 'all' && categoryId !== params.categoryId) {
        router.push(`/analyze/item-exploration/${categoryId}`)
        return
      }

      // 카테고리 선택 시 자동으로 초기 데이터 로드
      if (categoryName && categoryName !== '전체') {
        fetchInitialData(categoryName)
      } else {
        setTrendData(null)
        setAllKeywords([])
        setCurrentPage(1)
        setHasMorePages(true)
      }
    },
    [categoryData, fetchInitialData, params.categoryId, router],
  )

  // 기간 변경 핸들러 - URL 업데이트 추가
  const handlePeriodChange = useCallback(
    (period: 'daily' | 'weekly') => {
      setSelectedPeriod(period)
      // URL 업데이트
      updateURL({ period: period === 'daily' ? undefined : period })
      // 기간 변경 시 현재 선택된 카테고리로 다시 조회
      if (currentCategoryName && currentCategoryName !== '전체') {
        fetchInitialData(currentCategoryName)
      }
    },
    [currentCategoryName, fetchInitialData, updateURL],
  )

  // 직접 입력 모드 핸들러
  const handleDirectInputToggle = () => {
    setIsDirectInputMode(!isDirectInputMode)
    if (!isDirectInputMode) {
      // 직접 입력 모드로 전환 시 기존 선택 초기화
      setSelectedCategory1(null)
      setSelectedCategory2(null)
      setSelectedCategory3(null)
      setSelectedCategory4(null)
    }
  }

  // 직접 입력 변경 핸들러
  const handleDirectInputChange = (value: string) => {
    setDirectInputValue(value)
    if (value.trim()) {
      fetchInitialData(value.trim())
    } else {
      setTrendData(null)
      setAllKeywords([])
      setCurrentPage(1)
      setHasMorePages(true)
    }
  }

  if (isLoadingCategories) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-400">카테고리를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-4 p-4">
      {/* 카테고리 선택 */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            카테고리 선택
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 사용법 안내 */}
          {!isCategorySelected && (
            <div className="rounded-lg border border-blue-500 bg-blue-900/20 p-4">
              <h3 className="mb-2 text-sm font-medium text-blue-200">사용법</h3>
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    1
                  </span>
                  관심있는 카테고리를 보려면{' '}
                  <span className="inline-flex items-center gap-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs font-medium text-gray-200">
                    N차 분류
                    <ArrowDown className="h-3 w-3" />
                  </span>
                  를 단계별로 차근차근 선택해보세요.
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    2
                  </span>
                  카테고리를 특정하기 어렵다면 분류 선택 우상단의{' '}
                  <span className="inline-flex items-center gap-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs font-medium text-gray-200">
                    <Edit3 className="h-3 w-3" />
                    직접입력
                  </span>
                  을 통해 입력해보세요.
                </p>
              </div>
            </div>
          )}

          {/* 직접 입력 모드 */}
          {isDirectInputMode ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">카테고리 직접 입력</label>
                <input
                  type="text"
                  placeholder="예: 패션의류, 디지털가전, 화장품 등..."
                  value={directInputValue}
                  onChange={e => handleDirectInputChange(e.target.value)}
                  className="w-full max-w-md rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">원하는 카테고리명을 직접 입력하세요</p>
              </div>
              {directInputValue && (
                <div className="rounded-lg border border-green-500 bg-green-900/20 p-3">
                  <p className="text-sm text-green-200">
                    <span className="font-medium">입력된 카테고리:</span> {directInputValue}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* CategorySelector 컴포넌트 사용 */
            <CategorySelector
              onCategoryChange={handleCategoryChange}
              maxLevel={4}
              showAllOption={false}
              initialCategoryId={categoryId}
            />
          )}
          {/* 선택된 카테고리 경로 */}
          {isCategorySelected ? (
            <div className="mt-4 rounded-lg bg-blue-900/20 p-3">
              <p className="text-sm text-blue-200">
                <span className="font-medium">선택된 카테고리:</span> {currentCategoryName}
                {!isDirectInputMode && selectedCategory1 && (
                  <>
                    {selectedCategory2 && ` > ${selectedCategory2.name}`}
                    {selectedCategory3 && ` > ${selectedCategory3.name}`}
                    {selectedCategory4 && ` > ${selectedCategory4.name}`}
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-yellow-900/20 p-3">
              <p className="text-sm text-yellow-200">
                <span className="font-medium">카테고리를 선택해주세요</span>
              </p>
            </div>
          )}

          {/* 사용자 커스텀 설정 */}
          {isCategorySelected && (
            <div className="mt-4 space-y-4 rounded-lg bg-gray-800/50 p-4">
              <h3 className="text-sm font-medium text-white">분석 조건 설정</h3>

              {/* 성별 선택 */}
              <div className="space-y-2">
                <label className="text-xs text-gray-300">성별</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: '전체' },
                    { value: 'f', label: '여성' },
                    { value: 'm', label: '남성' },
                  ].map(gender => (
                    <button
                      key={gender.value}
                      onClick={() => !isChangingSettings && setSelectedGender(gender.value as 'all' | 'f' | 'm')}
                      disabled={isChangingSettings}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedGender === gender.value
                          ? 'bg-blue-600 text-white'
                          : isChangingSettings
                            ? 'cursor-not-allowed bg-gray-600 text-gray-500'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                      {gender.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 연령대 선택 */}
              <div className="space-y-2">
                <label className="text-xs text-gray-300">
                  연령대 {selectedAgeGroups.length === 0 && <span className="text-blue-400">(전체)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['10', '20', '30', '40', '50', '60'].map(age => (
                    <button
                      key={age}
                      onClick={() => !isChangingSettings && handleAgeGroupToggle(age)}
                      disabled={isChangingSettings}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedAgeGroups.includes(age)
                          ? 'bg-green-600 text-white'
                          : isChangingSettings
                            ? 'cursor-not-allowed bg-gray-600 text-gray-500'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                      {age === '60' ? '60대 이상' : `${age}대`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 현재 설정 요약 */}
              <div
                className={`rounded-lg p-3 text-xs ${
                  isChangingSettings ? 'border border-yellow-600/50 bg-yellow-900/30' : 'bg-gray-700/50'
                }`}>
                <div className="mb-1 flex items-center gap-2 font-medium text-white">
                  현재 설정
                  {isChangingSettings && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <div className="h-3 w-3 animate-spin rounded-full border border-yellow-400 border-t-transparent"></div>
                      <span className="text-xs">변경 중...</span>
                    </div>
                  )}
                </div>
                <div className={isChangingSettings ? 'text-yellow-200' : 'text-gray-300'}>
                  성별: {selectedGender === 'all' ? '전체' : selectedGender === 'f' ? '여성' : '남성'}
                </div>
                <div className={isChangingSettings ? 'text-yellow-200' : 'text-gray-300'}>
                  연령대:{' '}
                  {selectedAgeGroups.length === 0
                    ? '전체'
                    : selectedAgeGroups.map(age => `${age === '60' ? '60대 이상' : `${age}대`}`).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* 기간 선택 */}
          {isCategorySelected && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-200">기간 선택</label>
              <Tabs value={selectedPeriod} onValueChange={handlePeriodChange}>
                <TabsList className="bg-gray-700">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-gray-600">
                    일간
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-gray-600">
                    주간
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* 직접 입력 토글 버튼 */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleDirectInputToggle} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              {isDirectInputMode ? '분류 선택' : '직접입력'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 검색어 데이터 표시 */}
      {isCategorySelected && (
        <div className="space-y-4">
          {/* 로딩 상태 */}
          {(isLoadingDB || isFetchingDataLab) && (
            <Card className="border-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-blue-200">
                    {isFetchingDataLab ? '데이터랩에서 데이터를 가져오는 중...' : '데이터를 조회하는 중...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 키워드 분석 데이터 */}
          {trendData && !isLoadingDB && !isFetchingDataLab && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  검색어 데이터
                </CardTitle>
                <CardDescription>
                  {currentCategoryName} - {selectedPeriod === 'weekly' ? '주간' : '일간'} 데이터
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 요약 정보 */}
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-gray-700/50 p-3">
                      <div className="text-gray-400">총 검색어 수</div>
                      <div className="text-lg font-bold text-white">{trendData.keywords?.length || 0}개</div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-3">
                      <div className="text-gray-400">수집일</div>
                      <div className="text-sm text-white">
                        {trendData.collectedAt ? new Date(trendData.collectedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-3">
                      <div className="text-gray-400">카테고리</div>
                      <div className="text-sm text-white">{trendData.categoryName || currentCategoryName}</div>
                    </div>
                  </div>

                  {/* 검색어 목록 */}
                  {trendData.keywords && trendData.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-200">검색어 목록 (페이지 {currentPage}/25)</h4>
                      <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-600">
                        <div className="space-y-1 p-2">
                          {trendData.keywords.map((keyword: any, index: number) => (
                            <div
                              key={`${keyword.keyword}-${index}`}
                              className="flex items-center justify-between rounded-lg bg-gray-700/30 p-3 hover:bg-gray-700/50">
                              <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                  {keyword.rank || index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{keyword.keyword}</div>
                                  {keyword.trend && (
                                    <div className="text-xs text-gray-400">
                                      트렌드: {keyword.trendText || keyword.trend}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-400">
                                {keyword.monthlySearchCount && (
                                  <div>월 검색량: {keyword.monthlySearchCount.toLocaleString()}</div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* 에러 메시지 */}
                          {fetchError && (
                            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-900/20 p-4">
                              <div className="flex items-center space-x-2">
                                <div className="h-5 w-5 text-red-400">⚠️</div>
                                <div className="text-sm text-red-200">{fetchError}</div>
                                <button
                                  onClick={() => setFetchError(null)}
                                  className="ml-auto text-xs text-red-400 hover:text-red-300">
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 무한 스크롤 트리거 */}
                          {hasMorePages && (
                            <div id="load-more-trigger" className="py-4 text-center">
                              {isLoadingMore ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                  <span className="text-blue-200">다음 페이지 로딩 중...</span>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">스크롤하여 더 많은 데이터 로드</div>
                              )}
                            </div>
                          )}

                          {!hasMorePages && currentPage >= 25 && (
                            <div className="py-4 text-center text-sm text-gray-400">
                              모든 페이지를 로드했습니다 (총 {trendData.keywords.length}개 키워드)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 데이터 없음 */}
          {!trendData && !isLoadingDB && !isFetchingDataLab && (
            <Card className="border-gray-500">
              <CardContent className="p-4">
                <div className="text-center text-gray-400">
                  <BarChart3 className="mx-auto mb-2 h-8 w-8" />
                  <p>해당 카테고리의 검색어 데이터가 없습니다.</p>
                  <p className="text-sm">데이터가 자동으로 수집되었습니다.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
