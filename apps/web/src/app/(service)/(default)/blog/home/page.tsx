// import ProductView from './view'
// import { fetchMatchTaobao, getPatchNormal } from './serverAction'
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageTitle from '../../(_components)/PageTitle'

export const dynamic = 'force-dynamic'

export default function DashboardPage({ searchParams }) {
  const [selectedEngine, setSelectedEngine] = useState('NAVER')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const dropdownRef = useRef(null)
  const router = useRouter()

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const dummyRecommendKeywords = ['달까지가자', '전주니', '커쇼', '오존', '텔레토비 키링']

  // 키워드 검색 함수
  const handleSearch = (searchKeyword = keyword, platform = selectedEngine.toLowerCase()) => {
    if (!searchKeyword.trim()) return

    const params = new URLSearchParams({
      keyword: searchKeyword,
      platform: platform,
    })

    router.push(`/blog/home/keyword-analysis?${params.toString()}`)
  }

  // 엔터 키 처리
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 추천 키워드 클릭 처리
  const handleRecommendKeywordClick = recommendKeyword => {
    handleSearch(recommendKeyword, 'naver')
  }

  //   const { user, listData, dateString } = await fetchMatchTaobao({ date })
  //   const patch = await getPatchNormal()
  return (
    <div className="w-full">
      <PageTitle title="홈" />
      {/* <ProductView listData={listData} dateString={dateString} user={user} patch={patch} /> */}
      {/* 여기서부터 작성 */}
      <div className="min-h-screen text-white">
        {/* 메인 컨텐츠 */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            {/* 메인 제목 */}
            <h1 className="mb-6 text-4xl leading-tight md:text-[40px] lg:text-[48px]">
              검색 엔진 마케팅을 위한
              <br />
              가장 쉽고 강력한 데이터 분석 툴, <span className="font-bold">타이탄툴즈</span>
            </h1>

            {/* 부제목 */}
            <p className="mx-auto mb-12 max-w-2xl bg-gradient-to-r from-[#00c685] to-[#51a9f3] bg-clip-text text-lg text-transparent md:text-xl">
              키워드 데이터 분석을 통해 마케팅 전략의 유형을 늘리고, 비즈니스를 확장시켜보세요.
            </p>

            {/* 검색 박스 */}
            <div className="relative mx-auto mb-8 max-w-2xl" ref={dropdownRef}>
              <div className="relative flex items-center rounded-lg bg-white p-2">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center border-r border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50">
                    {selectedEngine === 'NAVER' ? (
                      <span className="text-sm font-medium text-green-600">NAVER</span>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-[#4081ec]">Google</span>
                      </div>
                    )}
                    <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="분석할 키워드를 입력하세요"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-transparent px-4 py-3 text-gray-700 focus:outline-none"
                />
                <button
                  onClick={() => handleSearch()}
                  className="rounded-lg bg-gray-100 p-3 transition-colors hover:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* 드롭다운 메뉴 - 검색 박스 외부에 배치 */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full z-10 -mt-3 w-[100px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={() => {
                      console.log('NAVER clicked')
                      setSelectedEngine('NAVER')
                      setIsDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left first:rounded-t-lg hover:bg-gray-50">
                    <span className="text-sm font-medium text-green-600">NAVER</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Google clicked')
                      setSelectedEngine('GOOGLE')
                      setIsDropdownOpen(false)
                    }}
                    className="flex w-full items-center px-3 py-2 text-left last:rounded-b-lg hover:bg-gray-50">
                    <span className="text-sm font-medium text-[#4081ec]">Google</span>
                  </button>
                </div>
              )}
            </div>

            {/* 추천 키워드 태그 */}
            <div className="mb-16 flex flex-wrap justify-center gap-3">
              {dummyRecommendKeywords.map((recommendKeyword, index) => (
                <span
                  key={index}
                  onClick={() => handleRecommendKeywordClick(recommendKeyword)}
                  className="cursor-pointer px-4 py-2 text-sm text-white transition-colors hover:underline">
                  #{recommendKeyword}
                </span>
              ))}
              <span className="cursor-pointer px-4 py-2 text-sm text-blue-400 transition-colors hover:text-blue-300">
                트렌드 더 보기 →
              </span>
            </div>

            {/* 하단 통계 */}
            <div className="text-center">
              <p className="text-sm text-gray-400">28,2만+ 기업 및 개인이 타이탄툴즈를 통해 데이터 분석 중</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
