'use client'
import { useEffect, useState } from 'react'
import { useServerAction } from '@repo/utils'
import { toast } from 'sonner'
import { updateBanWords } from '../serverAction'
import { twMerge } from 'tailwind-merge'
import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface BanWordsManagerProps {
  user: {
    banWords?: {
      banWords: string[]
    } | null
  }
  onUpdate: () => void
}

export default function BanWordsManager({ user, onUpdate }: BanWordsManagerProps) {
  const [banWordsInput, setBanWordsInput] = useState(user.banWords?.banWords?.join(', ') || '')
  const [isBanWordsOpen, setIsBanWordsOpen] = useState(false)
  const { execute: executeUpdateBanWords } = useServerAction(updateBanWords, {
    onSuccess: ({ message }) => {
      toast.success(message)
      onUpdate()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 쉼표로 구분된 문자열을 배열로 변환
    // 빈 문자열은 제거
    // 중복 제거
    // 쉼표사이 공백 제거
    const banWordsArray = banWordsInput
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .filter((word, index, self) => self.indexOf(word) === index)

    executeUpdateBanWords({ banWords: banWordsArray })
  }

  useEffect(() => {
    setBanWordsInput(user.banWords?.banWords?.join(', ') || '')
  }, [user.banWords])

  return (
    <div className="w-full">
      <div className="mb-2 text-lg font-semibold">
        금지어 설정
        <span className="text-muted-foreground text-sm font-normal"> (쉼표로 구분)</span>
      </div>
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <Input
          type="text"
          value={banWordsInput}
          onChange={e => setBanWordsInput(e.target.value)}
          placeholder="금지어를 쉼표(,)로 구분하여 입력하세요"
          className="flex-grow"
        />
        <Button type="submit" className="shrink-0">
          저장
        </Button>
      </form>

      <div className="mt-2">
        <div className="flex items-center gap-2">
          <p
            className={twMerge(
              'text-muted-foreground flex-1 space-x-1 space-y-1 text-sm',
              isBanWordsOpen ? '' : 'line-clamp-1',
            )}>
            {user.banWords?.banWords && user.banWords.banWords.length > 0 && <span>현재 금지어: </span>}
            {user.banWords?.banWords && user.banWords.banWords.length > 0 ? (
              user.banWords.banWords.map((word, index) => (
                <span key={index} className="bg-muted inline-block rounded-md px-2 py-1 text-xs">
                  {word}
                </span>
              ))
            ) : (
              <span className="text-destructive">설정된 금지어가 없습니다.</span>
            )}
            {/* 현재 금지어: {user.banWords.join(', ') || '없음'} */}
          </p>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsBanWordsOpen(prev => !prev)}>
            {isBanWordsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {/* {isBanWordsOpen && (
          <div className="mt-2">
            <div className="text-muted-foreground text-sm">
              {user.banWords.length > 0 ? (
                <div className="space-x-1 space-y-1">
                  {user.banWords.map((word, index) => (
                    <div key={index} className="bg-muted inline-block rounded-md px-2 py-1 text-xs">
                      {word}
                    </div>
                  ))}
                </div>
              ) : (
                <p>설정된 금지어가 없습니다.</p>
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}
