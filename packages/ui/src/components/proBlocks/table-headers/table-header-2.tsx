'use client'

import * as React from 'react'
import { addDays, format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/components/button'
import { Calendar } from '@repo/ui/components/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover'
import { ListFilter, Plus } from 'lucide-react'

export function TableHeader2() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2023, 0, 20),
    to: addDays(new Date(2023, 0, 20), 20),
  })

  return (
    <div className="bg-background container mx-auto flex w-full flex-col justify-between gap-6 p-6 lg:flex-row">
      {/* Title and description */}
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-lg font-semibold leading-7 lg:text-xl">Table name</h2>
        <p className="text-muted-foreground text-sm leading-5">
          Read and write directly to databases and stores from your projects.
        </p>
      </div>

      {/* Date range picker and buttons */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="order-2 w-full lg:order-1 lg:w-[300px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="order-1 flex gap-3 lg:order-2">
          <Button variant="outline" className="order-2 lg:order-1">
            <ListFilter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="order-1 lg:order-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>
    </div>
  )
}
