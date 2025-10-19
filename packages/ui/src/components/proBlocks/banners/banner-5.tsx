'use client'

import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import Link from 'next/link'

export function Banner5() {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-6" // you can remove classes here - it's just for the wrapper
    >
      <Link
        href="#"
        className="border-border bg-background hover:bg-muted box-border flex h-11 w-fit items-center gap-2 rounded-full border pl-1 pr-2 shadow-sm"
        aria-label="View our 5,000+ customer testimonials">
        <div className="flex items-center -space-x-4" aria-hidden="true">
          <Avatar className="border-background size-9 border-2">
            <AvatarImage src="https://github.com/shadcn.png" alt="Customer avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="border-background size-9 border-2">
            <AvatarImage src="https://github.com/shadcn.png" alt="Customer avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="border-background size-9 border-2">
            <AvatarImage src="https://github.com/shadcn.png" alt="Customer avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
        <span className="text-muted-foreground text-sm font-medium">
          Loved by <span className="text-foreground">5K+ customers</span>
        </span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </Link>

      <Link
        href="#"
        className="box-border flex h-11 w-fit items-center gap-2 rounded-full border border-zinc-900 bg-zinc-900 pl-1 pr-2 shadow-sm hover:bg-zinc-800"
        aria-label="View our 5,000+ customer testimonials">
        <div className="flex items-center -space-x-4" aria-hidden="true">
          <Avatar className="size-8 border-2 border-zinc-900">
            <AvatarImage src="https://github.com/shadcn.png" alt="Customer avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="size-8 border-2 border-zinc-900">
            <AvatarImage src="https://github.com/shadcn.png" alt="Customer avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="size-8 border-2 border-zinc-900">
            <AvatarImage src="https://github.com/shadcn.png" alt="Customer avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
        <span className="text-sm font-medium text-white">Loved by 5K+ customers</span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  )
}
