'use client'

import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Card, CardHeader, CardFooter } from '@repo/ui/components/card'
import { Separator } from '@repo/ui/components/separator'
import { Mail, Phone } from 'lucide-react'

export function Card1() {
  return (
    <Card className="mx-auto mt-12 max-w-sm">
      <CardHeader className="space-y-4 p-4 md:p-6">
        <div className="relative flex flex-col gap-3 md:flex-row md:items-start">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
          </Avatar>
          <div className="space-y-0.5">
            <h3 className="text-card-foreground text-base font-semibold leading-6">Title Text</h3>
            <p className="text-muted-foreground text-sm">This is a card description.</p>
          </div>
          <Badge className="absolute right-0 top-0">Admin</Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex items-center justify-between border-t p-2">
        <Button variant="ghost" size="sm" className="w-full">
          <Mail />
          Email
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Button variant="ghost" size="sm" className="w-full">
          <Phone />
          Call
        </Button>
      </CardFooter>
    </Card>
  )
}
