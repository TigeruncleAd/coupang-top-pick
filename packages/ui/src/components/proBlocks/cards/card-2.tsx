'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import { Badge } from '@repo/ui/components/badge'

export function Card2() {
  return (
    <Card className="mx-auto mt-12 max-w-sm">
      <CardContent className="p-4 md:p-6">
        <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
          </Avatar>

          <div className="space-y-0.5">
            <h3 className="text-card-foreground text-base font-semibold leading-6">Title Text</h3>
            <p className="text-muted-foreground text-sm font-normal leading-5">This is a card description.</p>
          </div>

          <Badge className="absolute right-0 top-0">Admin</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
