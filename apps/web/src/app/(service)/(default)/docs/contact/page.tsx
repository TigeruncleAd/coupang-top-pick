'use client'

import { useRouter } from 'next/navigation'
import Section from '@/components/Section'
import { twMerge } from 'tailwind-merge'

export default function ContactPage() {
  const router = useRouter()

  function handleBackButtonClick() {
    router.back()
  }

  return (
    <>
      {/* <BackButtonAppBar onClick={handleBackButtonClick} /> */}
      <main
        className={twMerge('flex min-h-[calc(100svh)] flex-col items-start gap-y-[12px] whitespace-pre-line bg-white')}>
        <Section>
          <div className="text-title-3 text-color-text-high pb-4 pt-6">문의하기</div>

          <div>
            <div className="text-color-text-high pb-32">
              <div className="pb-2 pt-4">
                <h2 className="text-text-1-strong">쿠팡탑픽</h2>
                <p className="text-text-2 text-color-text-medium mt-2">
                  쿠팡탑픽은 <b>㈜쿠팡탑픽</b>이 제공하는 서비스입니다.
                  <br />
                  문의사항은 다음 연락처로 남겨주세요.
                </p>
                <h2 className="text-text-1-strong mt-4">연락처</h2>
                <p className="text-text-2 text-color-text-medium mt-2">
                  서비스 문의 - king.sourcing.company@gmail.com
                  {/* <br /> */}
                  {/* 개발자 - xero0001@naver.com */}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </main>
    </>
  )
}
