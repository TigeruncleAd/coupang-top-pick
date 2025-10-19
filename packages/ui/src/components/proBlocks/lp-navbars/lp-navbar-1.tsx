'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Button } from '@repo/ui/components/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

const MENU_ITEMS = [
  { label: 'Products', href: '#' },
  { label: 'Use cases', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'FAQ', href: '#' },
] as const

interface NavMenuItemsProps {
  className?: string
}

const NavMenuItems = ({ className }: NavMenuItemsProps) => (
  <div className={`flex flex-col gap-1 md:flex-row ${className ?? ''}`}>
    {MENU_ITEMS.map(({ label, href }) => (
      <Link key={label} href={href}>
        <Button variant="ghost" className="w-full md:w-auto">
          {label}
        </Button>
      </Link>
    ))}
  </div>
)

export function LpNavbar1() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(prev => !prev)

  return (
    <nav className="bg-background sticky top-0 isolate z-50 py-3.5 md:py-4">
      <div className="container relative m-auto flex flex-col justify-between gap-4 px-6 md:flex-row md:items-center md:gap-6">
        <div className="flex justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Button
            variant="ghost"
            className="flex size-9 items-center justify-center md:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden w-full flex-row justify-end gap-5 md:flex">
          <NavMenuItems />
          <Link href="#">
            <Button>Get started</Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="flex w-full flex-col justify-end gap-5 pb-2.5 md:hidden">
            <NavMenuItems />
            <Link href="#">
              <Button className="w-full">Get started</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
