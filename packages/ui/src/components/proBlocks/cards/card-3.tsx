'use client'

import { Card, CardHeader, CardFooter } from '@repo/ui/components/card'
import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import { Button } from '@repo/ui/components/button'
import { Separator } from '@repo/ui/components/separator'
import { Mail, Phone } from 'lucide-react'

export function Card3() {
  return (
    <Card className="mx-auto mt-12 max-w-sm">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl md:h-20 md:w-20">
            <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
          </Avatar>
          <div className="flex flex-col gap-1.5 text-center">
            <h3 className="text-card-foreground font-semibold">Title Text</h3>
            <p className="text-muted-foreground text-sm">This is a card description.</p>
          </div>
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
