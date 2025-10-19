'use client'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Search, Download } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'

export function TableHeader4() {
  return (
    <div className="bg-background container mx-auto flex w-full flex-col justify-between gap-4 p-6">
      {/* Title and description */}
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-lg  font-semibold leading-7 lg:text-xl">Table name</h2>
        <p className="text-muted-foreground text-sm leading-5">
          Read and write directly to databases and stores from your projects.
        </p>
      </div>

      {/* Search and buttons */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row">
        <Tabs defaultValue="all" className="w-full lg:w-auto">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1">
              Sent
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="flex-1">
              Unpaid
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex-1">
              Paid
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="order-1 flex gap-3 lg:order-2">
          <div className="relative order-2 w-full lg:order-1 lg:max-w-[280px]">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input className="h-10 pl-9" type="search" placeholder="Search" />
          </div>
          <Button variant="outline" className="order-2 w-10 lg:order-1 lg:w-auto">
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Export</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
