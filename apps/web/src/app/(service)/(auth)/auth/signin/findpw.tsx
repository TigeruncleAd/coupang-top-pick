'use client'

import { useState } from 'react'
import { findPw } from '../authServerActions'
import { useServerAction } from '@repo/utils'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

export default function FindPw() {
  const [email, setEmail] = useState('')
  const [accountId, setAccountId] = useState('')
  const [matched, setMatched] = useState(false)
  const [alert, setAlert] = useState('')

  const { execute, isLoading } = useServerAction(findPw, {
    onSuccess: data => {
      setMatched(true)
    },
    onError: data => {
      setAlert(data.message ?? '')
    },
  })
  if (!matched)
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-foreground text-xl font-semibold">비밀번호 찾기</h2>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountId" className="text-foreground text-sm font-medium">
              아이디
            </Label>
            <Input
              id="accountId"
              type="text"
              placeholder="회원 아이디를 입력해주세요"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              required
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-sm font-medium">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력해주세요"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="text-muted-foreground text-xs">
            회원정보에 입력된 회원 아이디와 이메일을 정확히 입력해주세요.
          </div>

          {alert && (
            <div className="bg-destructive/20 border-destructive/30 text-destructive rounded-md border p-3 text-sm">
              {alert}
            </div>
          )}

          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            disabled={isLoading}
            onClick={() =>
              execute({
                accountId,
                email,
              })
            }>
            {isLoading ? '전송 중...' : '비밀번호 찾기'}
          </Button>
        </form>
      </div>
    )
  else
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-foreground text-xl font-semibold">비밀번호 찾기</h2>
        </div>

        <div className="bg-muted/30 border-border rounded-lg border p-6 text-center">
          <div className="text-foreground mb-4 text-sm">등록하신 이메일로 비밀번호 재설정 링크가 발송되었습니다.</div>
          <div className="text-muted-foreground text-xs">이메일이 도착하지 않았다면 스팸 메일함을 확인해주세요.</div>
        </div>
      </div>
    )
}
