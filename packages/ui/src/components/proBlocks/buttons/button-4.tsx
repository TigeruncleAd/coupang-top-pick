'use client'

import { Button } from '@repo/ui/components/button'
import { Plus, PenLine, Send, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

export function Button4() {
  return (
    <div className="mx-auto mt-10 flex w-fit -space-x-px">
      <Button variant="outline" className="flex h-10 items-center gap-2 rounded-r-none">
        <Plus className="h-4 w-4" />
        New
      </Button>

      <Button variant="outline" className="flex h-10 items-center gap-2 rounded-none">
        <PenLine className="h-4 w-4" />
        Edit
      </Button>

      <Button variant="outline" className="flex h-10 items-center gap-2 rounded-none">
        <Send className="h-4 w-4" />
        Send
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-l-none">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Action 1</DropdownMenuItem>
          <DropdownMenuItem>Action 2</DropdownMenuItem>
          <DropdownMenuItem>Action 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
