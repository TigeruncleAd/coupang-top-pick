'use client'

import React from 'react'
import { Button } from '@repo/ui/components/button'
import { ThumbsUp } from 'lucide-react'

export function Button2() {
  const [isLiked, setIsLiked] = React.useState(false)
  const [likeCount, setLikeCount] = React.useState(24)

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prevCount => (isLiked ? prevCount - 1 : prevCount + 1))
  }

  return (
    <div className="mx-auto mt-10 flex w-fit items-center -space-x-px">
      <Button
        variant={isLiked ? 'default' : 'outline'}
        className={`flex h-10 items-center gap-2 rounded-r-none px-4 py-2 ${
          isLiked ? 'bg-primary text-primary-foreground' : ''
        }`}
        onClick={toggleLike}
        aria-pressed={isLiked}
        aria-label={isLiked ? 'Unlike' : 'Like'}>
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm font-medium leading-5">{isLiked ? 'Liked' : 'Like'}</span>
      </Button>

      <Button
        variant={isLiked ? 'default' : 'outline'}
        className={`flex h-10 items-center rounded-l-none px-3 py-2 ${
          isLiked ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        }`}
        aria-label={`${likeCount} likes`}>
        <span className="text-sm font-medium leading-5">{likeCount}</span>
      </Button>
    </div>
  )
}
