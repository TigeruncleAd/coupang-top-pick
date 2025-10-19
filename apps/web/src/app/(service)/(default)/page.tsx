'use client'

import { kdayjs } from '@repo/utils'
import { useMe } from '../../../../hooks/useMe'
import { redirect } from 'next/navigation'
import { PATH } from '../../../../consts/const'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

export const dynamic = 'force-dynamic'
export default function IndexPage() {
  const { me, status } = useMe()
  // if (status === 'unauthenticated') {
  //   redirect(PATH.SIGNIN)
  // }

  return (
    <div>
      <div className="flex h-screen w-full items-center justify-center">
        {/* <div className="text-center text-2xl font-medium text-gray-600">
          {me?.accountId}님 이용해주셔서 감사합니다.
          <br />
          좌측의 메뉴를 통해 서비스를 이용해 주세요.
          <br />
          <br />
          현재 남은 검색 횟수는 : <span className="font-bold text-gray-700">{me?.remainingProductCount}</span>회 입니다.
          <br />
          <br />
          계정 만료일은 :{' '}
          <span className="font-bold text-gray-700">{kdayjs(me?.expiredAt).format('YYYY년 MM월 DD일 HH시')}</span>{' '}
          입니다.
        </div> */}
      </div>
    </div>
  )
}
