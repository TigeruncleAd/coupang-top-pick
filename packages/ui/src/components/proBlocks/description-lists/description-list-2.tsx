'use client'

import { Button } from '@repo/ui/components/button'

interface DescriptionListItemProps {
  label: string
  children: React.ReactNode
}

function DescriptionListItem({ label, children }: DescriptionListItemProps) {
  return (
    <div className="border-border grid grid-cols-1 gap-x-6 gap-y-2 border-t py-5 md:grid-cols-12 md:py-6">
      <div className="text-foreground col-span-4 text-sm font-semibold">{label}</div>
      <div className="col-span-8 text-sm">{children}</div>
    </div>
  )
}

export function DescriptionList2() {
  return (
    <div className="bg-background">
      <div className="mx-auto p-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-foreground text-lg font-semibold md:text-xl">Profile Information</h2>
            <p className="text-muted-foreground text-sm">Personal details and general information</p>
          </div>
        </div>

        <div className="flex flex-col">
          <DescriptionListItem label="Full name">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <span className="text-muted-foreground">Alex Thompson</span>
              <Button variant="link" className="hidden h-5 md:flex">
                Edit
              </Button>
              <Button variant="outline" className="w-full md:hidden">
                Edit
              </Button>
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="Address">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <span className="text-muted-foreground">123 Main Street, City, Country</span>
              <Button variant="link" className="hidden h-5 md:flex">
                Edit
              </Button>
              <Button variant="outline" className="w-full md:hidden">
                Edit
              </Button>
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="Email address">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <span className="text-muted-foreground">alex@example.com</span>
              <Button variant="link" className="hidden h-5 md:flex">
                Edit
              </Button>
              <Button variant="outline" className="w-full md:hidden">
                Edit
              </Button>
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="Phone number">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <span className="text-muted-foreground">+1 234 567 890</span>
              <Button variant="link" className="hidden h-5 md:flex">
                Edit
              </Button>
              <Button variant="outline" className="w-full md:hidden">
                Edit
              </Button>
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="About">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <span className="text-muted-foreground">
                A motivated professional with 5+ years of experience in software development.
              </span>
              <Button variant="link" className="hidden h-5 md:flex">
                Edit
              </Button>
              <Button variant="outline" className="w-full md:hidden">
                Edit
              </Button>
            </div>
          </DescriptionListItem>
        </div>
      </div>
    </div>
  )
}
