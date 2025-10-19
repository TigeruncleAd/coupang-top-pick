'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { ArrowRight, List, LayoutGrid, CalendarFold, ClipboardList, Users, Clock, LucideIcon } from 'lucide-react'

interface EmptyCardProps {
  icon: LucideIcon
  title: string
  description: string
}

function EmptyCard({ icon: Icon, title, description }: EmptyCardProps) {
  return (
    <Card>
      <CardContent className="relative flex flex-col items-stretch gap-4 p-4 md:flex-row md:items-start md:p-6">
        <Icon className="text-primary h-5 w-5 shrink-0 md:h-6 md:w-6" />
        <div className="flex-1 space-y-1">
          <h3 className="text-card-foreground font-semibold leading-5">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 md:static">
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  )
}

export function EmptySection2() {
  return (
    <section className="bg-background">
      {' '}
      {/* Add border border-border shadow-sm and rounded-lg class to make this section look like a card */}
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="space-y-1">
          <h2 className="text-card-foreground text-lg font-semibold md:text-xl">Products</h2>
          <p className="text-muted-foreground text-sm">
            Create your first project by selecting a template or starting from scratch.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <EmptyCard icon={List} title="Create a list" description="Organize tasks into simple lists." />
          <EmptyCard icon={LayoutGrid} title="Create a gallery" description="Showcase items visually and neatly." />
          <EmptyCard icon={CalendarFold} title="Create a calendar" description="Plan events with clear schedules." />
          <EmptyCard icon={ClipboardList} title="Create a board" description="Manage projects with visual boards." />
          <EmptyCard icon={Users} title="Create a team" description="Collaborate effectively with your team." />
          <EmptyCard icon={Clock} title="Create a timeline" description="Track progress with chronological views." />
        </div>
      </div>
    </section>
  )
}
