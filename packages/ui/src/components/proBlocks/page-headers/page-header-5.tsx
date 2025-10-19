'use client'

import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { EllipsisVertical, ExternalLink, PenLine, Rocket, Share2 } from 'lucide-react'

export function PageHeader5() {
  return (
    <div className="bg-background border-border border-b py-4">
      <div className="container mx-auto flex items-center  justify-between px-4 lg:px-6">
        {/* Project title */}
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Project Alpha</h1>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden md:inline-flex">
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button variant="ghost" className="hidden md:inline-flex">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="ghost" className="hidden md:inline-flex">
            <PenLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button>
            <Rocket className="mr-2 hidden h-4 w-4 sm:block" />
            Publish
          </Button>

          {/* Dropdown for mobile */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PenLine className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
