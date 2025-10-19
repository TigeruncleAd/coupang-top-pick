'use client'

import { Button } from '@repo/ui/components/button'

export function SectionFooter2() {
  return (
    <div className="bg-background border-border border-t py-4">
      <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center lg:px-6">
        <div className="text-muted-foreground w-full text-sm">Replace this text your content</div>
        <div className="flex flex-row-reverse items-center gap-2 md:flex-row">
          <Button variant="outline">View</Button>
          <Button variant="outline">Edit</Button>
          <Button>Save</Button>
        </div>
      </div>
    </div>
  )
}
