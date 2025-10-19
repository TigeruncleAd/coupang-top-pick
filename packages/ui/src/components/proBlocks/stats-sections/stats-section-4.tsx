'use client'

import { Card, CardContent } from '@repo/ui/components/card'

export function StatsSection4() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-8 md:gap-12">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-muted-foreground text-sm font-semibold md:text-base">Stats section</p>
            <h2 className="text-foreground text-3xl font-bold leading-tight md:text-4xl">
              Data-driven highlights that
              <br />
              showcase impact
            </h2>
            <p className="text-muted-foreground">
              Add a concise value statement that explains how your metrics demonstrate success and growth. Focus on
              transformation and measurable outcomes while keeping it under 2 lines. Align with your statistical data
              display.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row">
            <Card className="rounded-xl">
              <CardContent className="flex flex-col gap-2 p-5 pt-5 md:gap-3 md:p-6">
                <h3 className="text-primary font-semibold">Stat title</h3>
                <span className="text-foreground text-3xl font-bold md:text-4xl">2,400%</span>

                <p className="text-muted-foreground text-base">
                  Each stat should include a bold numerical figure followed by a brief, compelling description.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardContent className="flex flex-col gap-2 p-5 pt-5 md:gap-3 md:p-6">
                <h3 className="text-primary font-semibold">Stat title</h3>
                <span className="text-foreground text-3xl font-bold md:text-4xl">$410K</span>
                <p className="text-muted-foreground text-base">
                  Each stat should include a bold numerical figure followed by a brief, compelling description.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardContent className="flex flex-col gap-2 p-5 pt-5 md:gap-3 md:p-6">
                <h3 className="text-primary font-semibold">Stat title</h3>
                <span className="text-foreground text-3xl font-bold md:text-4xl">11,000</span>
                <p className="text-muted-foreground text-base">
                  Each stat should include a bold numerical figure followed by a brief, compelling description.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
