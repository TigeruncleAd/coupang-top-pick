'use client'

import { Button } from '@repo/ui/components/button'
import { Separator } from '@repo/ui/components/separator'
import { Card, CardContent } from '@repo/ui/components/card'
import { File, Download } from 'lucide-react'

interface DescriptionListItemProps {
  label: string
  children: React.ReactNode
}

function DescriptionListItem({ label, children }: DescriptionListItemProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-foreground text-sm font-semibold">{label}</div>
      <div className="text-muted-foreground text-sm">{children}</div>
    </div>
  )
}

export function DescriptionList4() {
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
          <div className="border-border grid grid-cols-1 gap-5 border-t py-5 md:grid-cols-2 md:gap-6 md:py-6">
            <DescriptionListItem label="Full name">Alex Thompson</DescriptionListItem>
            <Separator className="md:hidden" />
            <DescriptionListItem label="Email address">alex@example.com</DescriptionListItem>
          </div>
          <div className="border-border grid grid-cols-1 gap-5 border-t py-5 md:grid-cols-2 md:gap-6 md:py-6">
            <DescriptionListItem label="Address">123 Main Street, City, Country</DescriptionListItem>
            <Separator className="md:hidden" />
            <DescriptionListItem label="Phone number">+1 234 567 890</DescriptionListItem>
          </div>
          <div className="border-border grid grid-cols-1 gap-5 border-t py-5 md:gap-6 md:py-6">
            <DescriptionListItem label="About">
              A seasoned software engineer with 5+ years of experience specializing in full-stack web development.
              Proven track record of delivering scalable solutions using React, Node.js, and cloud technologies. Strong
              focus on clean code architecture and performance optimization. Currently leading a team of 4 developers
              and actively mentoring junior engineers. Passionate about creating accessible and user-friendly
              applications.
            </DescriptionListItem>
          </div>
          <div className="border-border grid grid-cols-1 gap-5 border-t py-5 md:gap-6 md:py-6">
            <DescriptionListItem label="Documents">
              <div className="flex w-full flex-col gap-2 md:flex-row md:gap-6">
                <Card className="w-full">
                  <CardContent className="flex items-center gap-3 p-4 md:p-6">
                    <File className="text-foreground h-4 w-4 shrink-0" />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-card-foreground text-sm font-semibold">Resume.pdf</span>
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
                <Card className="w-full">
                  <CardContent className="flex items-center gap-3 p-4 md:p-6">
                    <File className="text-foreground h-4 w-4 shrink-0" />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-card-foreground text-sm font-semibold">Portfolio.pdf</span>
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
    </div>
  )
}
