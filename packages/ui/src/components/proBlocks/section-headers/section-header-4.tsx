'use client'

import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Input } from '@repo/ui/components/input'
import { EllipsisVertical, Search } from 'lucide-react'

export function SectionHeader4() {
  return (
    <div className="bg-background pt-4 md:pt-6">
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        {/* Title */}
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Storage</h2>
            <p className="text-muted-foreground text-sm">
              Read and write directly to databases and stores from your projects.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 md:flex-row">
            {/* Actions */}
            <div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
              <div className="relative w-full">
                <Input type="search" placeholder="Search" className="pl-8" />
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
              </div>
              <div className="absolute right-[-8px] top-[-8px] md:static">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
