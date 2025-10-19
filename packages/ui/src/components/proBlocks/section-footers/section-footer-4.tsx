'use client'

import { Button } from '@repo/ui/components/button'

export function SectionFooter4() {
  return (
    <div className="bg-background border-border border-t py-4">
      <div className="container mx-auto flex flex-col justify-between gap-4 px-4 md:flex-row lg:px-6">
        <Button>Purchase Credits</Button>
        <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
          <div className="text-muted-foreground text-sm">Need more?</div>
          <Button className="w-full md:w-auto" variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  )
}
