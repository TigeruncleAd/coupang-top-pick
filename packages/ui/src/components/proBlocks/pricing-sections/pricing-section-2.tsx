'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Check, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@repo/ui/components/tooltip'

const pricingData = {
  plans: [
    {
      name: 'Basic',
      description: 'A short benefit statement that highlights the ideal user for this.',
      features: [
        {
          name: 'Basic project management',
          tooltip: 'Create and manage up to 5 projects',
        },
        {
          name: '5GB storage space',
          tooltip: 'Secure cloud storage for your files',
        },
        {
          name: 'Email support',
          tooltip: 'Get help via email within 48 hours',
        },
      ],
      price: 99,
      variant: 'secondary',
    },
    {
      name: 'Standard',
      description: 'A short benefit statement that highlights the ideal user for this.',
      features: [
        {
          name: 'Advanced project tools',
          tooltip: 'Access to timeline and milestone features',
        },
        {
          name: '25GB storage space',
          tooltip: 'Extended storage for larger projects',
        },
        {
          name: 'Priority email support',
          tooltip: 'Get help via email within 24 hours',
        },
        {
          name: 'Team collaboration',
          tooltip: 'Work together with up to 10 team members',
        },
      ],
      price: 199,
      variant: 'secondary',
    },
    {
      name: 'Pro',
      description: 'A short benefit statement that highlights the ideal user for this.',
      features: [
        {
          name: 'Custom workflows',
          tooltip: 'Create and automate custom workflows',
        },
        {
          name: '100GB storage space',
          tooltip: 'Ample storage for enterprise needs',
        },
        {
          name: 'Phone support',
          tooltip: 'Priority phone support during business hours',
        },
        {
          name: 'Advanced analytics',
          tooltip: 'Detailed insights and custom reports',
        },
        {
          name: 'API access',
          tooltip: 'Full API access for custom integrations',
        },
      ],
      price: 299,
      variant: 'default',
      highlighted: true,
    },
    {
      name: 'Premium',
      description: 'A short benefit statement that highlights the ideal user for this.',
      features: [
        {
          name: 'Enterprise security',
          tooltip: 'Advanced security and compliance features',
        },
        {
          name: 'Unlimited storage',
          tooltip: 'No limits on your storage needs',
        },
        {
          name: '24/7 priority support',
          tooltip: 'Round-the-clock dedicated support',
        },
        {
          name: 'Custom training',
          tooltip: 'Personalized onboarding and training',
        },
        {
          name: 'Advanced integrations',
          tooltip: 'Custom enterprise integrations',
        },
        {
          name: 'Dedicated success manager',
          tooltip: 'Your personal point of contact',
        },
      ],
      price: 499,
      variant: 'secondary',
    },
  ],
}

export function PricingSection2() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="pricing-section-title-2">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-12">
          {/* Section Header */}
          <div className="flex max-w-xl flex-col items-center gap-4 text-center md:gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-base font-semibold">Pricing section</p>
            {/* Main Title */}
            <h2 id="pricing-section-title-2" className="text-3xl font-bold md:text-4xl">
              Benefit-focused headline that highlights choice
            </h2>
            {/* Section Description */}
            <p className="text-muted-foreground text-base">
              Add a concise value statement that addresses price sensitivity and showcases plan flexibility. Focus on
              transformation and results while keeping it under 2 lines. Align with your pricing table options.
            </p>
          </div>

          {/* Four-Column Pricing Grid - Responsive layout that stacks on mobile */}
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pricingData.plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`rounded-xl p-6 ${plan.highlighted ? 'border-primary border-2 shadow-lg' : ''}`}>
                {/* Card Content Container */}
                <CardContent className="flex flex-col gap-8 p-0">
                  {/* Plan Header Section */}
                  <div className="flex flex-col gap-6">
                    {/* Plan Title and Description Block */}
                    <div className="relative flex flex-col gap-3">
                      <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-primary' : ''}`}>{plan.name}</h3>
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    </div>

                    {/* Price Display with Currency and Period */}
                    <div className="flex items-end gap-0.5">
                      <span className="text-4xl font-semibold">${plan.price}</span>
                      <span className="text-muted-foreground text-base">/month</span>
                    </div>

                    {/* Call-to-Action Button */}
                    <Button variant={plan.variant as any} className="w-full">
                      Purchase plan
                    </Button>
                  </div>

                  {/* Features List Section */}
                  <div className="flex flex-col gap-4">
                    {/* Features Header with Plan Inheritance */}
                    <p className="text-sm font-medium">
                      {index === 0
                        ? "What's included:"
                        : `Everything in ${pricingData?.plans?.[index - 1]?.name}, plus:`}
                    </p>
                    {/* Features Grid with Interactive Tooltips */}
                    <div className="flex flex-col gap-4">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {/* Feature Checkmark Icon */}
                          <Check className="text-primary h-5 w-5" />
                          {/* Feature Name */}
                          <span className="text-muted-foreground flex-1 text-sm">{feature.name}</span>
                          {/* Interactive Tooltip for Feature Details */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger aria-label={`More information about ${feature.name}`}>
                                <Info className="text-muted-foreground h-4 w-4 cursor-pointer opacity-70 hover:opacity-100" />
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
