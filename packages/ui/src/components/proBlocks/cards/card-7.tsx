'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Link, Download } from 'lucide-react'

export function Card7() {
  return (
    <Card className="mx-auto mt-12 max-w-lg">
      <CardContent className="flex items-center gap-3 p-4 md:p-6">
        <Link className="text-foreground h-4 w-4 shrink-0" />

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-card-foreground text-sm font-semibold">resume_1.pdf</span>
            <span className="text-muted-foreground text-sm">2,4mb</span>
          </div>

          {/* Desktop button */}
          <Button variant="outline" className="hidden md:flex">
            Download
          </Button>

          {/* Mobile button */}
          <Button variant="outline" size="icon" className="md:hidden">
            <Download />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
