'use client'

import * as React from 'react'
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group'

export function Button7() {
  const [value, setValue] = React.useState('today')

  return (
    <div className="bg-background mx-auto mt-10 flex w-fit items-center gap-0.5 rounded-lg p-0.5">
      <ToggleGroup type="single" value={value} onValueChange={setValue} className="flex items-center">
        <ToggleGroupItem
          value="today"
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground h-10 rounded-md px-3 text-sm font-medium leading-5">
          Today
        </ToggleGroupItem>
        <ToggleGroupItem
          value="week"
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground h-10 rounded-md px-3 text-sm font-medium leading-5">
          This week
        </ToggleGroupItem>
        <ToggleGroupItem
          value="month"
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground h-10 rounded-md px-3 text-sm font-medium leading-5">
          This month
        </ToggleGroupItem>
        <ToggleGroupItem
          value="year"
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground h-10 rounded-md px-3 text-sm font-medium leading-5">
          This year
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
