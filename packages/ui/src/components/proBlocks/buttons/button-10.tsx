'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

export function Button10() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="mx-auto mt-10 w-fit">
      <Button
        variant="ghost"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="relative flex h-9 w-9 items-center justify-center">
        <span
          className={`absolute transition-all duration-300 ${isMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
          <Menu className="h-4 w-4" />
        </span>
        <span
          className={`absolute transition-all duration-300 ${isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
          <X className="h-4 w-4" />
        </span>
      </Button>
    </div>
  )
}
