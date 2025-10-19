'use client'

import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@repo/ui/components/dropdown-menu'
import { ChevronDown, Rocket } from 'lucide-react'

export function Button3() {
  return (
    <div className="mx-auto mt-10 flex w-fit -space-x-px">
      <Button variant="outline" className="flex items-center justify-center gap-2 rounded-r-none">
        <Rocket className="h-4 w-4" />
        <span>Publish</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex h-10 w-10 items-center justify-center rounded-l-none p-2">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <span>Menu Item 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Menu Item 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Menu Item 3</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
