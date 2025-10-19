'use client'

import { Card, CardHeader, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { MoreHorizontal } from 'lucide-react'

export function Card5() {
  return (
    <Card className="mx-auto mt-12 max-w-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="text-foreground flex h-8 w-8 items-center justify-center">
            <svg viewBox="0 0 32 32" className="h-full w-full">
              <circle cx="16" cy="16" r="16" fill="currentColor" />
            </svg>
          </div>

          <h3 className="text-card-foreground flex-1 font-semibold">Title Text</h3>

          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 border-t p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Last invoice</p>
          <p className="text-card-foreground text-right text-sm">December 13, 2024</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Amount</p>
          <p className="text-card-foreground text-right text-sm">$45</p>
        </div>
      </CardContent>
    </Card>
  )
}
