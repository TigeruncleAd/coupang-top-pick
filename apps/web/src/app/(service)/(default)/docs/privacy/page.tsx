'use client'

import { useRouter } from 'next/navigation'
// import BackButtonAppBar from '../../../../../shared/components/appBar/BackButtonAppBar'
import { twMerge } from 'tailwind-merge'
import Section from '@/components/Section'
import { termContents } from '../../../../../../consts/terms'
// import BottomRoundedButton from '../../../(_components)/components/BottomRoundedButton'

export default function PrivacyPage() {
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
          <div className="text-title-3 text-color-text-high pb-4 pt-6">개인정보 수집・이용 동의</div>

          <div>{termContents.agreementOnService}</div>
        </Section>
      </main>
    </>
  )
}
