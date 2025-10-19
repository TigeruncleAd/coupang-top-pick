'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { PATH } from '../../../../../../consts/const'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Dialog, DialogContent, DialogTrigger } from '@repo/ui/components/dialog'
import { useMe } from '../../../../../../hooks/useMe'
import Image from 'next/image'
import FindId from './findId'
import FindPw from './findpw'
import Link from 'next/link'

export default function SigninForm() {
  const router = useRouter()
  const { status } = useMe()

  const [form, setForm] = useState({
    accountId: '',
    password: '',
  })

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(PATH.HOME)
    }
  }, [status])

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await signIn(
      'credentials',
      {
        redirect: false,
        accountId: form.accountId,
        password: form.password,
      },
      {
        type: 'SIGNIN',
      },
    )

    if (!res) {
      alert('로그인에 실패하였습니다.')
      return
    }

    if (res.ok) {
      router.push(PATH.HOME)
      return
    } else {
      switch (res.error) {
        case 'USER_ALREADY_EXISTS':
          alert('이미 존재하는 Username입니다.')
          return
        case 'EXPIRED_USER':
          alert('만료된 사용자입니다.')
          return
        case 'INACTIVE_USER':
          alert('만료된 사용자입니다.')
          return
        default:
          alert('로그인에 실패하였습니다.')
          return
      }
    }
  }
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen w-full flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* 로고 섹션 */}
          <div className="mb-8 flex flex-col items-center justify-center gap-3">
            {/* <Image src="/images/logo/titan-logo.webp" alt="Selling Tools" width={32} height={32} /> */}
            <h1 className="text-xl font-bold">셀로직 - SELLOGIC</h1>
          </div>

          {/* 로그인 카드 */}
          <Card className="bg-card shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">로그인</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="accountId" className="text-sm font-medium">
                    아이디
                  </Label>
                  <Input
                    id="accountId"
                    type="text"
                    placeholder="아이디를 입력해주세요"
                    value={form.accountId}
                    onChange={e => setForm({ ...form, accountId: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력해주세요"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="h-11 w-full text-base font-semibold" size="lg">
                  로그인
                </Button>

                {/* <div className="mt-5 flex items-center justify-center gap-3 text-sm font-medium leading-tight">
                  <Link
                    href={PATH.SIGNUP}
                    className="text-muted-foreground hover:text-foreground bg-transparent px-4 py-2 underline">
                    회원가입
                  </Link>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-muted-foreground hover:text-foreground underline">
                        아이디 찾기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <FindId />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-muted-foreground hover:text-foreground underline">
                        비밀번호 찾기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <FindPw />
                    </DialogContent>
                  </Dialog>
                </div> */}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } else return <div>로딩중...</div>
}
