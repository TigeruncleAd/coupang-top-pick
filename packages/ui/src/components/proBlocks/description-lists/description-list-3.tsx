'use client'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Textarea } from '@repo/ui/components/textarea'
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

export function DescriptionList3() {
  return (
    <div className="bg-background">
      <div className="mx-auto p-6">
        <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:justify-between">
          <div className="space-y-1">
            <h2 className="text-foreground text-lg font-semibold md:text-xl">Profile Information</h2>
            <p className="text-muted-foreground text-sm">Personal details and general information</p>
          </div>
          <Button>Save</Button>
        </div>

        <div className="flex flex-col">
          <DescriptionListItem label="Full name">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <Input placeholder="Full Name" className="md:max-w-sm" defaultValue="Alex Thompson" />
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="Address">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <Input placeholder="Address" className="md:max-w-sm" defaultValue="123 Main Street, City, Country" />
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="Email address">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <Input placeholder="Email address" className="md:max-w-sm" defaultValue="alex@example.com" />
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="Phone number">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <Input placeholder="Phone number" className="md:max-w-sm" defaultValue="+1 234 567 890" />
            </div>
          </DescriptionListItem>
          <DescriptionListItem label="About">
            <div className="flex flex-col justify-between gap-x-6 gap-y-4 md:flex-row md:items-center">
              <Textarea
                placeholder="About"
                className="text-sm md:max-w-sm"
                defaultValue="A motivated professional with 5+ years of experience in software development."
              />
            </div>
          </DescriptionListItem>
        </div>
        <Button className="mt-2 block md:hidden">Save</Button>
      </div>
    </div>
  )
}
