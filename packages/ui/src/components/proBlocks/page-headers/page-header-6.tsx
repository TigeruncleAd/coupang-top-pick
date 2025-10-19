'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { EllipsisVertical } from 'lucide-react'

export function PageHeader6() {
  return (
    <div className="bg-background border-border border-b py-4 md:py-6">
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        {/* Main content */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">John Doe</h1>
              <p className="text-muted-foreground text-sm lg:text-base">hi@example.com</p>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Share</DropdownMenuItem>
                  <DropdownMenuItem>View</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="outline" className="hidden lg:inline-flex">
              Share
            </Button>
            <Button variant="outline" className="hidden lg:inline-flex">
              View
            </Button>
            <Button variant="outline">Edit</Button>
            <Button>Publish</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
