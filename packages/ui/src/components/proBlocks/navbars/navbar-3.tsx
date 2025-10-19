'use client'

import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Avatar, AvatarImage } from '@repo/ui/components/avatar'
import { Input } from '@repo/ui/components/input'
import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Bell, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Separator } from '@repo/ui/components/separator'

export function Navbar3() {
  return (
    <nav className="bg-background w-full border-b shadow-sm">
      <div className="container relative mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Logo />
        {/* Desktop search */}
        <div className="absolute left-1/2 hidden w-[360px] -translate-x-1/2 md:block">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input type="text" placeholder="Search" className="h-10 pl-9" />
          </div>
        </div>

        <div className="flex gap-3">
          {/* Mobile search */}
          <Button size="icon" variant="ghost" className="text-muted-foreground flex md:hidden [&_svg]:size-5">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button size="icon" variant="ghost" className="text-muted-foreground [&_svg]:size-5 md:[&_svg]:size-4">
              <Bell className="h-4 w-4" />
            </Button>
            <Badge className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center p-0.5">2</Badge>
          </div>

          {/* User dropdown */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>My Profile</DropdownMenuItem>
              <DropdownMenuItem>Account</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
