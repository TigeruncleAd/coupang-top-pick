'use client'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Input } from '@repo/ui/components/input'
import { EllipsisVertical, Search } from 'lucide-react'

export function Section2() {
  return (
    <div className="bg-background">
      {' '}
      {/* Add border border-border shadow-sm and rounded-lg class to make this section look like a card */}
      {/* Section header */}
      <div className="container mx-auto flex flex-col gap-6 px-4 pt-4 md:pt-6 lg:px-6">
        {/* Title */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 md:justify-start">
              <h2 className="text-xl font-semibold">Storage</h2>
              <Badge variant="secondary">Status</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Read and write directly to databases and stores from your projects.
            </p>
          </div>
          {/* Search and Actions */}
          <div className="flex flex-col-reverse gap-3 md:flex-row">
            <div className="relative">
              <Input type="search" placeholder="Search" className="pl-8" />
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            </div>
            <div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button variant="outline" className="hidden lg:inline-flex">
                View
              </Button>
              <Button variant="outline" className="hidden lg:inline-flex">
                Edit
              </Button>
              <Button>Create new</Button>
            </div>
          </div>
        </div>
      </div>
      {/* Section body */}
      <div className="container mx-auto px-4 py-6 lg:px-6">
        <div className="text-muted-foreground border-border bg-muted w-full rounded-md border border-dashed p-6 text-center">
          Replace this div with your content
        </div>
      </div>
      {/* Section footer */}
      <div className="border-border border-t py-4">
        <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center lg:px-6">
          <div className="text-muted-foreground w-full text-sm">Replace this text with your content</div>
          <div className="flex flex-row-reverse items-center gap-2 md:flex-row">
            <Button variant="outline">View</Button>
            <Button variant="outline">Edit</Button>
            <Button>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
