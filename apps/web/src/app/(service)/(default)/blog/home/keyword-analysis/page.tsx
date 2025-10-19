'use client'
import { useSearchParams } from 'next/navigation'
import PageTitle from '../../../(_components)/PageTitle'

export default function KeywordAnalysisPage() {
  const searchParams = useSearchParams()
  const keyword = searchParams.get('keyword')
  const platform = searchParams.get('platform')

  return (
    <div className="w-full">
      {/* <PageTitle title="키워드 분석" /> */}

      <div className="container mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-white">검색 결과</h1>
          <p className="text-gray-400">선택한 키워드와 플랫폼에 대한 검색 결과입니다.</p>
        </div>

        {/* 파라미터 표시 카드 */}
        <div className="mb-8 rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">검색 정보</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 키워드 정보 */}
            <div className="rounded-lg bg-gray-700 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-300">검색 키워드</h3>
              <p className="text-lg font-semibold text-white">{keyword ? `"${keyword}"` : '키워드가 없습니다'}</p>
            </div>

            {/* 플랫폼 정보 */}
            <div className="rounded-lg bg-gray-700 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-300">검색 플랫폼</h3>
              <div className="flex items-center">
                {platform === 'naver' && <span className="text-lg font-semibold text-green-500">NAVER</span>}
                {platform === 'google' && <span className="text-lg font-semibold text-blue-500">Google</span>}
                {!platform && <span className="text-lg font-semibold text-gray-400">플랫폼이 없습니다</span>}
              </div>
            </div>
          </div>
        </div>

        {/* URL 정보 표시 */}
        <div className="mb-8 rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">URL 파라미터</h2>
          <div className="rounded bg-gray-900 p-4 font-mono text-sm">
            <p className="text-gray-300">
              <span className="text-blue-400">keyword:</span>{' '}
              <span className="text-yellow-400">{keyword || 'null'}</span>
            </p>
            <p className="mt-1 text-gray-300">
              <span className="text-blue-400">platform:</span>{' '}
              <span className="text-yellow-400">{platform || 'null'}</span>
            </p>
          </div>
        </div>

        {/* 분석 결과 예시 (테스트용) */}
        {/* {keyword && platform && (
          <div className="rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">분석 결과 (테스트)</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-600 p-4 text-center">
                <h3 className="mb-1 text-sm font-medium text-blue-100">검색량</h3>
                <p className="text-2xl font-bold text-white">12,450</p>
              </div>

              <div className="rounded-lg bg-green-600 p-4 text-center">
                <h3 className="mb-1 text-sm font-medium text-green-100">경쟁도</h3>
                <p className="text-2xl font-bold text-white">중간</p>
              </div>

              <div className="rounded-lg bg-purple-600 p-4 text-center">
                <h3 className="mb-1 text-sm font-medium text-purple-100">트렌드</h3>
                <p className="text-2xl font-bold text-white">상승</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-white">연관 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {[`${keyword} 추천`, `${keyword} 리뷰`, `${keyword} 가격`, `${keyword} 비교`].map(
                  (relatedKeyword, index) => (
                    <span key={index} className="rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-300">
                      {relatedKeyword}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        )} */}

        {/* 파라미터가 없을 때 메시지 */}
        {(!keyword || !platform) && (
          <div className="rounded-lg border border-yellow-600 bg-yellow-900/20 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-yellow-400">검색 정보가 부족합니다</h3>
            <p className="text-yellow-200">홈페이지에서 키워드를 검색하여 분석을 시작해보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
