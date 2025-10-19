'use client'
import { useState } from 'react'
import { useServerAction } from '@repo/utils'
import { findId } from '../authServerActions'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

export default function FindId() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [matched, setMatched] = useState(false)
  const [alert, setAlert] = useState('')
  const [matchedAccountId, setMatchedAccountId] = useState('')
  const { execute, isLoading } = useServerAction(findId, {
    onSuccess: data => {
      setMatched(true)
      setMatchedAccountId(data.accountId)
    },
    onError: () => {
      setAlert('일치하는 정보가 없습니다.')
    },
  })

  if (!matched)
    return (
      <div className="bg-card w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-foreground text-xl font-semibold">아이디 찾기</h2>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground text-sm font-medium">
              이름
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="이름을 입력해주세요"
              value={name}
              onChange={e => setName(e.target.value)}
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

          <div className="text-muted-foreground text-xs">회원정보에 입력된 이름과 이메일을 정확히 입력해주세요.</div>

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
                name,
                email,
              })
            }>
            {isLoading ? '검색 중...' : '아이디 찾기'}
          </Button>
        </form>
      </div>
    )
  else
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-foreground text-xl font-semibold">아이디 찾기</h2>
        </div>

        <div className="bg-muted/30 border-border rounded-lg border p-6 text-center">
          <div className="text-muted-foreground mb-2 text-sm">{name}님의 아이디는</div>
          <div className="text-foreground bg-primary/10 inline-block rounded-md px-3 py-2 text-lg font-semibold">
            {matchedAccountId}
          </div>
          <div className="text-muted-foreground mt-2 text-sm">입니다.</div>
        </div>
      </div>
    )
}
