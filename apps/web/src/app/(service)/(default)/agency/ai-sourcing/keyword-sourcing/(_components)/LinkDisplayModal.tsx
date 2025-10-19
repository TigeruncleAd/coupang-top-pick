'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog'
import { Button } from '@repo/ui/components/button'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Progress } from '@repo/ui/components/progress'
import { X, AlertTriangle } from 'lucide-react'
import { openOffscreenWindowExt } from '@/lib/utils/extension'

interface LinkDisplayModalProps {
  isOpen: boolean
  query: string
  urls: string[]
  onClose: () => void
  extensionId: string
}

export default function LinkDisplayModal({ isOpen, query, urls, onClose, extensionId }: LinkDisplayModalProps) {
  const router = useRouter()
  const [isCrawling, setIsCrawling] = useState(false)
  const [progress, setProgress] = useState(0)
  const isCrawlingRef = useRef(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
    }
  }, [])

  if (!isOpen) return null

  const getUrlWithoutKsToken = (originalUrl: string) => {
    try {
      const url = new URL(originalUrl)
      url.searchParams.delete('ksToken')
      return url.toString()
    } catch (error) {
      console.error('Error parsing URL:', error)
      return originalUrl // 오류 발생 시 원본 URL 반환
    }
  }

  const handleClose = () => {
    setIsCrawling(false)
    setProgress(0)
    isCrawlingRef.current = false
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
    onClose()
  }

  const firstUrl = urls.length > 0 ? urls[0] : null
  const firstUrlWithoutKsToken = firstUrl ? getUrlWithoutKsToken(firstUrl) : null
  const secondUrlWithoutKsToken = urls.length > 1 ? getUrlWithoutKsToken(urls[1]) : null

  async function onClickCrawl() {
    setIsCrawling(true)
    setProgress(0)
    isCrawlingRef.current = true

    // 프로그래스 바 업데이트를 위한 인터벌 설정 (30초 동안 100%까지)
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 100
        }
        return prev + 100 / 250 // 100ms마다 증가하여 30초에 100% 완료
      })
    }, 100)

    // window.open(firstUrl, '_blank', 'noopener,noreferrer,width=100,height=100,top=0,left=0')
    await openOffscreenWindowExt({
      extensionId,
      targetUrl: firstUrl,
    })
    await new Promise(resolve => setTimeout(resolve, 25000))

    // 프로그래스 완료 처리
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
    setProgress(100)

    router.refresh()
    setIsCrawling(false)
    setProgress(0)
    isCrawlingRef.current = false
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>다음 링크를 열어 상품을 수집해주세요.</DialogTitle>
        </DialogHeader>

        {query && (
          <p className="text-muted-foreground mb-2 text-sm">
            검색어: <span className="text-foreground font-medium">{query}</span>
          </p>
        )}
        {firstUrlWithoutKsToken && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="mb-2 font-medium">※ 보안 문자 입력 안내</p>
              <p className="mb-2 text-xs">
                작업 시행 전 아래 링크를 클릭하여 보안문자 입력창이 나타나지 않는지 확인해주세요.
              </p>
              <div className="space-y-1">
                <a
                  href={firstUrlWithoutKsToken}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-semibold underline hover:no-underline">
                  [(보안문자 입력 1번)]
                </a>
                <a
                  href={secondUrlWithoutKsToken}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-semibold underline hover:no-underline">
                  [(보안문자 입력 2번)]
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 flex flex-col space-y-2">
          {/* {urls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md bg-blue-50 p-3 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
                {`네이버 쇼핑 링크 ${index + 1} (클릭하여 열기)`}
              </a>
            ))} */}

          {isCrawling && (
            <div className="mt-6 flex flex-col items-center space-y-4">
              <div className="w-full max-w-xs">
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-center">
                  <span className="text-lg font-semibold">{Math.round(progress)}%</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg font-medium">수집 중...</p>
                <p className="text-muted-foreground text-sm">외부 창에서 크롤링이 진행되고 있습니다</p>
              </div>
            </div>
          )}

          {!isCrawling && (
            <Button onClick={onClickCrawl} disabled={isCrawling} className="mt-6 w-full" variant="outline">
              수집 시작
            </Button>
          )}
        </div>

        {!isCrawling && (
          <div className="text-muted-foreground mt-4 text-sm">
            <p>
              각 링크를 클릭하여 새 탭에서 네이버 쇼핑 페이지를 직접 열어주세요. 페이지가 완전히 로드된 후 다음 링크를
              열어주시면 더 안정적인 수집이 가능합니다.
            </p>
            <p className="mt-1">모든 링크를 확인하셨다면, 이 창을 닫아주세요.</p>
          </div>
        )}

        {isCrawling && (
          <div className="text-muted-foreground mt-4 text-sm">
            <p className="text-center">크롤링이 완료될 때까지 잠시만 기다려주세요. (약 30초 소요)</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleClose} disabled={isCrawling} variant="secondary">
            {isCrawling ? '크롤링 중...' : '닫기 및 수집 완료'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
