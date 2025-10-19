'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Link, Download, Trash2 } from 'lucide-react'

export function Card8() {
  return (
    <Card className="mx-auto mt-12 max-w-lg">
      <CardContent className="flex items-center gap-3 p-4 md:p-6">
        <Link className="text-foreground h-4 w-4 shrink-0" />

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-card-foreground text-sm font-semibold">resume_1.pdf</span>
            <span className="text-muted-foreground text-sm">2,4mb</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="icon">
              <Download />
            </Button>
            <Button variant="outline" size="icon">
              <Trash2 />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
