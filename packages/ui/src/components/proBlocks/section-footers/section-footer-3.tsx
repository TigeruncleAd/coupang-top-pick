'use client'

import { Button } from '@repo/ui/components/button'

export function SectionFooter3() {
  return (
    <div className="bg-background border-border border-t py-4">
      <div className="container mx-auto flex flex-col flex-col-reverse items-start justify-between gap-4 px-4 md:flex-row md:items-center lg:px-6">
        <div className="flex items-center gap-2">
          <Button>Save</Button>
          <Button variant="outline">Edit</Button>
          <Button variant="outline">View</Button>
        </div>
        <div className="text-muted-foreground w-full text-sm md:text-right">Replace this text with your content</div>
      </div>
    </div>
  )
}
