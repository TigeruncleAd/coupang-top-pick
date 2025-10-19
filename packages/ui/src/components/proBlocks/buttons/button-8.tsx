'use client'

import React from 'react'
import { Button } from '@repo/ui/components/button'
import { Bookmark } from 'lucide-react'

export function Button8() {
  const [isBookmarked, setIsBookmarked] = React.useState(false)
  const [bookmarkCount, setBookmarkCount] = React.useState(24)

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    setBookmarkCount(prevCount => (isBookmarked ? prevCount - 1 : prevCount + 1))
  }

  return (
    <div className="mx-auto mt-10 flex w-fit items-center -space-x-px">
      <Button
        variant={isBookmarked ? 'default' : 'outline'}
        className={`flex h-10 items-center gap-2 rounded-r-none px-4 py-2 ${
          isBookmarked ? 'bg-primary text-primary-foreground' : ''
        }`}
        onClick={toggleBookmark}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
        <Bookmark className="h-4 w-4" />
        <span className="text-sm font-medium leading-5">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
      </Button>

      <Button
        variant={isBookmarked ? 'default' : 'outline'}
        className={`flex h-10 items-center rounded-l-none px-3 py-2 ${
          isBookmarked ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        }`}
        aria-label={`${bookmarkCount} bookmarks`}>
        <span className="text-sm font-medium leading-5">{bookmarkCount}</span>
      </Button>
    </div>
  )
}
