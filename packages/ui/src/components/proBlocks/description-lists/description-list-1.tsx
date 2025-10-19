'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { File, Download } from 'lucide-react'

interface DescriptionListItemProps {
  label: string
  children: React.ReactNode
}

function DescriptionListItem({ label, children }: DescriptionListItemProps) {
  return (
    <div className="border-border grid grid-cols-1 gap-x-6 gap-y-2 border-t py-5 md:grid-cols-12 md:py-6">
      <div className="text-foreground col-span-4 text-sm font-semibold">{label}</div>
      <div className="text-muted-foreground col-span-8 text-sm">{children}</div>
    </div>
  )
}

export function DescriptionList1() {
  return (
    <div className="bg-background">
      <div className="mx-auto p-6">
        <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:justify-between">
          <div className="space-y-1">
            <h2 className="text-foreground text-lg font-semibold md:text-xl">Application information</h2>
            <p className="text-muted-foreground text-sm">Personal details and general information</p>
          </div>
          <Button variant="outline">Edit</Button>
        </div>

        <div className="flex flex-col">
          <DescriptionListItem label="Full name">Alex Thompson</DescriptionListItem>
          <DescriptionListItem label="Address">123 Main Street, City, Country</DescriptionListItem>
          <DescriptionListItem label="Email address">alex@example.com</DescriptionListItem>
          <DescriptionListItem label="Phone number">+1 234 567 890</DescriptionListItem>
          <DescriptionListItem label="About">
            A motivated professional with 5+ years of experience in software development.
          </DescriptionListItem>
          <DescriptionListItem label="Documents">
            <div className="flex w-full flex-col gap-2">
              <Card>
                <CardContent className="flex items-center gap-3 p-4 md:p-6">
                  <File className="text-foreground h-4 w-4 shrink-0" />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-card-foreground text-sm font-semibold">CV.pdf</span>
                      <span className="text-muted-foreground text-sm">2,51mb</span>
                    </div>
                    <Button variant="outline" className="hidden md:flex">
                      Download
                    </Button>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Download />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4 md:p-6">
                  <File className="text-foreground h-4 w-4 shrink-0" />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-card-foreground text-sm font-semibold">Portfolio.pdf</span>
                      <span className="text-muted-foreground text-sm">11,24mb</span>
                    </div>
                    <Button variant="outline" className="hidden md:flex">
                      Download
                    </Button>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Download />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DescriptionListItem>
        </div>
      </div>
    </div>
  )
}
