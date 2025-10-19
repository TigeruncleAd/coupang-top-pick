'use client'

const NAVER_SEARCH_BASE_URL = 'https://search.shopping.naver.com/search/all'
// const POPUP_WINDOW_SPECS = 'width=100,height=100,left=10000,top=10000,noopener=true,noreferrer=true' // 더 이상 사용하지 않음
import { LICENSE_TYPE } from '@repo/database'
import { useState } from 'react'
import { ExecutingModal } from '../../../../uploadProduct/(_components)/Modals'
import { useRouter } from 'next/navigation'
import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import LinkDisplayModal from './LinkDisplayModal' // 새로 만든 모달 임포트
import { toast } from 'sonner'

const isDev = process.env.NODE_ENV === 'development'

function getNaverSearchUrl(query: string, token: string, page: string) {
  const params = new URLSearchParams({
    // agency: 'true',
    pagingIndex: page,
    pagingSize: '80',
    productSet: 'checkout',
    query,
    sort: 'rel',
    timestamp: '',
    viewType: 'list',
    ksToken: encodeURIComponent(token),
    isDev: isDev ? 'true' : 'false',
    agency: 'true',
  })
  return `${NAVER_SEARCH_BASE_URL}?${params.toString()}`
}

interface SearchFormProps {
  token: string
  onSearch: () => void
  license: LICENSE_TYPE
  extensionId: string
}

export default function SearchForm({ token, onSearch, license, extensionId }: SearchFormProps) {
  const router = useRouter()
  const [isCrawling, setIsCrawling] = useState(false)
  const [searchUrls, setSearchUrls] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    const query = e.target?.[0]?.value
    if (!query || query.length === 0) {
      toast.error('검색어를 입력해주세요.')
      return
    }
    setCurrentQuery(query)
    setIsCrawling(true) // 링크 생성 및 모달 표시 전까지 크롤링 중으로 간주

    const urlsToOpen: string[] = []
    for (let i = 1; i <= (license === LICENSE_TYPE.S ? 10 : 4); i++) {
      urlsToOpen.push(getNaverSearchUrl(query, token, i.toString()))
    }
    setSearchUrls(urlsToOpen)
    setIsModalOpen(true)
    // setIsCrawling(false)와 onSearch()는 모달이 닫힐 때 호출됨
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsCrawling(false)
    onSearch() // 부모 컴포넌트에 검색(수집) 완료 알림
    router.refresh() // 페이지 새로고침하여 변경사항 반영
  }

  return (
    <>
      {isCrawling && !isModalOpen && <ExecutingModal />}
      {isModalOpen && (
        <LinkDisplayModal
          isOpen={isModalOpen}
          query={currentQuery}
          urls={searchUrls}
          onClose={handleCloseModal}
          extensionId={extensionId}
        />
      )}
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-4">
        <Input type="text" placeholder="검색어를 입력해주세요." className="flex-grow" />
        <Button type="submit" className="bg-titan-red hover:bg-titan-red/90 shrink-0 text-white" disabled={isCrawling}>
          키워드 수집
        </Button>
      </form>
    </>
  )
}
