'use client'

import * as React from 'react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { Check, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@repo/ui/components/tooltip'

const pricingData = {
  plans: [
    {
      name: 'Basic',
      description: 'Perfect for individuals and small projects',
      features: [
        {
          name: 'Up to 5 team members',
          tooltip: 'Collaborate with up to 5 team members on unlimited projects',
        },
        {
          name: '10GB storage space',
          tooltip: 'Secure cloud storage for all your project files and assets',
        },
        {
          name: 'Basic analytics',
          tooltip: 'Access to essential metrics and performance tracking',
        },
      ],
      pricing: {
        monthly: 29,
        annually: 290,
      },
      variant: 'secondary',
    },
    {
      name: 'Standard',
      description: 'Ideal for growing teams and businesses',
      badge: 'Most popular',
      features: [
        {
          name: 'Up to 20 team members',
          tooltip: 'Scale your team with expanded collaboration capabilities',
        },
        {
          name: '50GB storage space',
          tooltip: 'More storage for larger projects and asset libraries',
        },
        {
          name: 'Advanced analytics',
          tooltip: 'Detailed insights with custom reporting and dashboards',
        },
        {
          name: 'Priority support',
          tooltip: 'Get help within 24 hours from our dedicated support team',
        },
      ],
      pricing: {
        monthly: 49,
        annually: 490,
      },
      variant: 'default',
    },
    {
      name: 'Enterprise',
      description: 'For large enterprises and advanced needs',
      features: [
        {
          name: 'Unlimited team members',
          tooltip: 'No limits on team size or collaboration',
        },
        {
          name: '250GB storage space',
          tooltip: 'Enterprise-grade storage with advanced security',
        },
        {
          name: 'Custom analytics',
          tooltip: 'Tailored analytics solutions with API access',
        },
        {
          name: '24/7 premium support',
          tooltip: 'Round-the-clock dedicated support with 4-hour response time',
        },
        {
          name: 'White-labeling',
          tooltip: 'Custom branding and white-label solutions',
        },
      ],
      pricing: {
        monthly: 99,
        annually: 990,
      },
      variant: 'secondary',
    },
  ],
}

export function PricingSection4() {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly')

  return (
    // Main pricing section container with light background
    <section className="bg-background py-16 md:py-24" aria-labelledby="pricing-section-title-4">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-8">
          {/* Section Header */}
          <div className="flex max-w-xl flex-col items-center gap-4 text-center md:gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-base font-semibold">Pricing section</p>
            {/* Main Title */}
            <h2 id="pricing-section-title-4" className="text-3xl font-bold md:text-4xl">
              Benefit-focused headline that highlights choice
            </h2>
            {/* Section Description */}
            <p className="text-muted-foreground text-base">
              Add a concise value statement that addresses price sensitivity and showcases plan flexibility. Focus on
              transformation and results while keeping it under 2 lines. Align with your pricing table options.
            </p>
          </div>

          {/* Billing Period Toggle Switch */}
          <Tabs value={billingPeriod} onValueChange={setBillingPeriod} className="w-fit">
            <TabsList className="bg-muted h-10 rounded-[40px] p-1">
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-background rounded-full px-3 py-1.5 data-[state=active]:shadow-sm">
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="annually"
                className="data-[state=active]:bg-background rounded-full px-3 py-1.5 data-[state=active]:shadow-sm">
                Annually
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Horizontal Pricing Cards Layout - Stacks on mobile */}
          <div className="mx-auto flex w-full flex-col gap-6 lg:max-w-5xl lg:flex-row">
            {pricingData.plans.map((plan, index) => (
              <Card key={plan.name} className={`space-y-8 p-8 ${index === 2 ? 'bg-foreground text-background' : ''}`}>
                {/* Plan Content Container */}
                <div className="space-y-6">
                  {/* Plan Title and Description Block */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold leading-7">{plan.name}</h3>
                    <p className={`text-sm leading-5 ${index === 2 ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Display with Currency and Period */}
                  <div className="flex items-end gap-0.5">
                    <span className="text-4xl font-semibold leading-10">
                      ${billingPeriod === 'monthly' ? plan.pricing.monthly : plan.pricing.annually}
                    </span>
                    <span className={`text-base leading-6 ${index === 2 ? 'opacity-70' : 'text-muted-foreground'}`}>
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  {/* Call-to-Action Button */}
                  <Button variant={index === 2 ? 'secondary' : 'default'} className="w-full">
                    Purchase plan
                  </Button>
                </div>

                {/* Features List Section */}
                <div className="space-y-4">
                  {/* Features Header with Plan Inheritance */}
                  <p className="text-sm font-medium">
                    {index === 0 ? "What's included:" : `Everything in ${pricingData?.plans?.[index - 1]?.name}, plus:`}
                  </p>
                  {/* Features Grid with Tooltips */}
                  <div className="flex flex-col gap-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className={`h-5 w-5 ${index === 2 ? '' : 'text-primary'}`} />
                        <span className={`flex-1 text-sm ${index === 2 ? 'opacity-70' : 'text-muted-foreground'}`}>
                          {feature.name}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info
                                className={`h-4 w-4 ${index === 2 ? 'opacity-40' : 'text-muted-foreground opacity-70'}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{feature.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
