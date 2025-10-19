'use client'

import { Button } from '@repo/ui/components/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function SectionFooter5() {
  return (
    <div className="bg-background border-border border-t py-4">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 lg:px-6">
        <Button variant="outline" className="w-10 md:min-w-[112px]">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden md:block">Previous</span>
        </Button>
        <span className="text-muted-foreground text-center text-sm">
          <span className="text-foreground font-medium">1-7</span> of 120
        </span>
        <Button variant="outline" className="w-10 md:min-w-[112px]">
          <span className="hidden md:block">Next</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
