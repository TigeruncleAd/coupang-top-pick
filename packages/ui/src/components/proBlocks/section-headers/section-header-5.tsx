'use client'

import { Label } from '@repo/ui/components/label'
import { Switch } from '@repo/ui/components/switch'
import { useState } from 'react'

export function SectionHeader5() {
  const [isEnabled, setIsEnabled] = useState(true)

  const handleSwitchChange = () => {
    setIsEnabled(!isEnabled)
  }

  return (
    <div className="bg-background pt-4 md:pt-6">
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        {/* Title */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Storage</h2>
            <p className="text-muted-foreground text-sm">
              Read and write directly to databases and stores from your projects.
            </p>
          </div>
          {/* Switch */}
          <div className="flex items-center gap-2">
            <Label
              htmlFor="switch"
              className={`order-2 md:order-1 ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch id="switch" checked={isEnabled} onCheckedChange={handleSwitchChange} className="order-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
