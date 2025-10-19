'use client'

import { openOffscreenWindowExt } from '@/lib/utils/extension'
import { Button } from '@repo/ui/components/button'
import { useState, useEffect } from 'react'
import { getSearchMallByKeyword } from '../serverAction'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog'
import { Progress } from '@repo/ui/components/progress'
import { LoadingCircle } from '@repo/ui/common/LoadingCircle'
import { Loader2 } from 'lucide-react'
import { formatTime } from '@/lib/utils/dateFormat'
import { decryptAesGcmBase64 } from '@/lib/utils/crypto'

const NAVER_SEARCH_BASE_URL = 'https://search.shopping.naver.com/search/all'
const DECRYPT_KEY = process.env.NEXT_PUBLIC_KOIKOI!
const isDev = process.env.NODE_ENV === 'development'
const AUTO_REFRESH_INTERVAL = 5000
const secondPerCount = 15

export default function ProductCrawler({
  extensionId,
  token,
  detailClassCode,
  minPrice,
  maxPrice,
  keyword,
  dateString,
  onClose,
}) {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [isAutoCrawling, setIsAutoCrawling] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [isRetry, setIsRetry] = useState(false)
  const [decryptedUrl, setDecryptedUrl] = useState<string>('')

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['getKeywordProductsCrawl', keyword, dateString],
    queryFn: () => getSearchMallByKeyword({ keyword, date: dateString }),
    enabled: !!keyword && !!dateString,
    staleTime: 0,
    retry: 3,
  })

  // Decrypt server-provided value when available
  useEffect(() => {
    console.log('run')
    const run = async () => {
      try {
        if (data?.n && DECRYPT_KEY) {
          const plain = await decryptAesGcmBase64(data.n as string, DECRYPT_KEY as string)
          setDecryptedUrl(plain)
          setIsAutoCrawling(true)
        } else {
          setDecryptedUrl('')
        }
      } catch (e) {
        console.error('Failed to decrypt payload', e)
        setDecryptedUrl('')
      }
    }
    run()
  }, [data?.n])

  const crawlData = async ({ targetUrl, mallId }: { targetUrl: string; mallId: string }) => {
    const url = `${decryptedUrl}/category/ALL?st=POPULAR&ksToken=${encodeURIComponent(token)}&mallId=${mallId}&detailClassCode=${detailClassCode}&np=${minPrice}&mp=${maxPrice}&isDev=${isDev}`
    await openOffscreenWindowExt({
      extensionId,
      targetUrl: url,
    })
  }
  const targetId = data?.i
  const status = data?.s
  const totalCount = data?.t
  const crawledCount = data?.c
  const ratio = Math.round((crawledCount / totalCount) * 100)
  const estimateTime = Math.round((totalCount - crawledCount) * secondPerCount)
  const formattedEstimateTime = formatTime(estimateTime)

  useEffect(() => {
    if (isAutoCrawling) {
      if (status === 'f' && !isRetry) {
        setIsAutoCrawling(false)
        setIsFailed(true)
        return
      }
      if (decryptedUrl) {
        console.log('crawling')
        setIsRetry(false)
        setIsFailed(false)
        crawlData({ targetUrl: decryptedUrl, mallId: targetId })
        return
      } else if (!decryptedUrl) {
        console.log('done')
        setIsRetry(false)
        setIsFailed(false)
        setIsAutoCrawling(false)
        return
      }
    }
  }, [decryptedUrl, isAutoCrawling])

  useEffect(() => {
    if (isAutoCrawling) {
      const newIntervalId = setInterval(() => {
        refetch()
      }, AUTO_REFRESH_INTERVAL)
      setIntervalId(newIntervalId)
    } else {
      if (intervalId) clearInterval(intervalId)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isAutoCrawling, dateString])

  function handleClose(open: boolean) {
    if (!open) {
      if (intervalId) clearInterval(intervalId)
      onClose()
    }
  }

  function handleRetry() {
    setIsRetry(true)
    const params = new URLSearchParams({
      // agency: 'true',
      pagingIndex: '2',
      pagingSize: '80',
      productSet: 'checkout',
      query: 'abc',
      sort: 'rel',
      timestamp: '',
      viewType: 'list',
      agency: 'true',
    })
    window.open(`${NAVER_SEARCH_BASE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={true} onOpenChange={open => handleClose(open)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>아래 버튼을 클릭하여 상품을 수집해주세요.</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="font-bold text-blue-400">불러오는중...</span>
          </div>
        ) : (
          <div>
            {!decryptedUrl && (
              <div className="py-4">
                <div className="text-muted-foreground text-sm">완료되었습니다. 창을 닫아 주세요.</div>
              </div>
            )}
            {!!decryptedUrl && (
              <div className="space-y-2 py-4">
                <div className="text-muted-foreground text-sm">
                  진행률 : {ratio}% (남은 시간 : 약 {formattedEstimateTime})
                </div>
                <Progress value={Number.isFinite(ratio) ? ratio : 0} />
              </div>
            )}
            {isFailed && !isRetry && (
              <div className="py-4">
                <div className="text-muted-foreground text-sm">
                  상품 수집 실패. 다음 링크를 열어 상품을 수집해주세요.
                </div>
                <Button
                  onClick={() => {
                    handleRetry()
                  }}
                  variant="default"
                  className="shrink-0 cursor-pointer">
                  링크 열기
                </Button>
              </div>
            )}
            {(!isFailed || isRetry) && !!decryptedUrl && (
              <Button
                onClick={() => {
                  setIsAutoCrawling(!isAutoCrawling)
                }}
                variant={isAutoCrawling ? 'destructive' : 'default'}
                className="shrink-0 cursor-pointer">
                {isAutoCrawling ? '상품 수집 중지' : '상품 수집 시작'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
