'use client'

import { Button } from '@repo/ui/components/button'
import { Inbox } from 'lucide-react'

export function EmptySection1() {
  return (
    <section className="bg-background px-4 py-6 md:px-6">
      {' '}
      {/* Add border border-border shadow-sm and rounded-lg class to make this section look like a card */}
      <div className="flex w-full flex-col items-center gap-6 rounded-lg border border-dashed p-6">
        <div className="bg-card flex h-12 w-12 items-center justify-center rounded-md border p-2 shadow-sm">
          <Inbox className="text-foreground h-6 w-6" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-foreground text-lg font-semibold md:text-xl">No databases added</h2>
          <p className="text-muted-foreground text-sm leading-5">
            Read and write directly to databases and stores from your projects.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch justify-center gap-3 md:flex-row md:items-center">
          <Button>Create new</Button>
          <Button variant="outline">Learn more</Button>
        </div>
      </div>
    </section>
  )
}
