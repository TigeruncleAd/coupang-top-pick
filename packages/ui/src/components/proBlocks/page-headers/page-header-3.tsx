'use client'

import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import Link from 'next/link'

export function PageHeader3() {
  return (
    <div className="bg-background border-border border-b pb-4 pt-0 md:pb-6">
      <nav className=" border-border mb-6 border-b">
        <div className="container mx-auto flex overflow-x-auto px-2 lg:px-3.5">
          <Link href="#" className="border-primary text-foreground flex-shrink-0 border-b-2 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Profile</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Reports</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Analytics</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Notifications</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2 md:px-3">Help Center</span>
          </Link>
        </div>
      </nav>
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        {/* Main content */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Project alpha</h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Manage your project's details such as name, image, description and settings.
            </p>
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
