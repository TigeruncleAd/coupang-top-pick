'use client'

import { useState } from 'react'
import { Card, CardHeader, CardFooter } from '@repo/ui/components/card'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Avatar, AvatarImage } from '@repo/ui/components/avatar'

export function Card6() {
  const [checked, setChecked] = useState(false)

  return (
    <Card className="mx-auto mt-12 max-w-sm">
      <CardHeader className="relative p-4 md:p-6">
        <div className="space-y-1.5">
          <h3 className="text-card-foreground text-base font-semibold leading-6">Title Text</h3>
          <p className="text-muted-foreground text-sm leading-5">This is a card description.</p>
        </div>
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
          className="absolute right-4 top-3 mt-0 md:right-6 md:top-5"
        />
      </CardHeader>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t p-4 md:px-6 md:py-4">
        <span className="text-card-foreground text-sm">
          Today
          <span className="text-muted-foreground ml-2 text-sm">10:00 PM - 11:45 PM</span>
        </span>
        <div className="flex items-center -space-x-2">
          {[...Array(5)].map((_, i) => (
            <Avatar key={i} className="border-card bg-background h-5 w-5 border-[1px]">
              <AvatarImage src="https://github.com/shadcn.png" alt={`User ${i + 1}`} />
            </Avatar>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
