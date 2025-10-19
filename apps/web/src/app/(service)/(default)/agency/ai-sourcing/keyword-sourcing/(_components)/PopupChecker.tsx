'use client'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert'
import { AlertCircle } from 'lucide-react'

export default function PopupChecker() {
  const [isPopupBlocked, setIsPopupBlocked] = useState(false)

  useEffect(() => {
    const testPopup = window.open('', '', 'width=1,height=1,left=0,top=0')
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
      setIsPopupBlocked(true)
    } else {
      testPopup.close()
      setIsPopupBlocked(false)
    }
  }, [])

  return isPopupBlocked ? (
    <Alert variant="destructive" className="bg-destructive/10 border-destructive mb-6 mt-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-semibold">팝업 차단 감지</AlertTitle>
      <AlertDescription className="text-base">
        팝업이 차단되어있습니다. 쇼핑몰 및 상품 수집을 위해 브라우저 설정에서 팝업을 허용해주세요.
      </AlertDescription>
    </Alert>
  ) : null
}
