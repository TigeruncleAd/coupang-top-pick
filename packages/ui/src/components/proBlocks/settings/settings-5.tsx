'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/card'
import { Separator } from '@repo/ui/components/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/components/table'
import { Menu, Zap, Search, X, Download, ExternalLink } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/components/pagination'
import Link from 'next/link'
import { Progress } from '@repo/ui/components/progress'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'

import { useState } from 'react'

function Navbar1() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const MobileTopBar = () => (
    <div
      className={`bg-background flex h-14 items-center justify-between px-4 ${
        !isMenuOpen ? 'border-border border-b' : ''
      }`}>
      <Button
        variant="ghost"
        onClick={toggleMenu}
        className="relative -ml-2 flex h-9 w-9 items-center justify-center [&_svg]:size-5">
        <span
          className={`absolute transition-all duration-300 ${
            isMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}>
          <Menu />
        </span>
        <span
          className={`absolute transition-all duration-300 ${
            isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          }`}>
          <X />
        </span>
      </Button>

      <Logo className="absolute left-1/2 h-8 w-8 -translate-x-1/2 transform" />

      <div className="absolute right-4 flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 p-0 [&_svg]:size-5">
          <Search className="text-muted-foreground" />
        </Button>
        <Button className="h-9 w-9 p-0 [&_svg]:size-5">
          <Zap />
        </Button>
      </div>
    </div>
  )

  const NavItems = ({ isMobile = false }) => {
    const linkClasses = `font-medium ${isMobile ? 'text-base' : 'text-sm'} ${
      isMobile ? 'text-muted-foreground' : 'text-muted-foreground hover:bg-primary/5'
    } px-3 py-2 rounded-md`

    return (
      <>
        <Link href="#" className={`${linkClasses}`}>
          Dashboard
        </Link>
        <Link href="#" className={linkClasses}>
          Orders
        </Link>
        <Link href="#" className={linkClasses}>
          Products
        </Link>
        <Link href="#" className={linkClasses}>
          Customers
        </Link>
        <Link href="#" className={`${linkClasses} text-primary`}>
          Settings
        </Link>
      </>
    )
  }

  return (
    <>
      <nav className="bg-background border-border hidden h-16 border-b shadow-sm lg:block">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-x-4">
            <Logo />
            <div className="flex items-center gap-x-1">
              <NavItems />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="text-muted-foreground h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
            <Button>
              <Zap className="h-4 w-4" /> Upgrade
            </Button>
          </div>
        </div>
      </nav>

      <nav className="lg:hidden">
        <MobileTopBar />
      </nav>

      {isMenuOpen && (
        <div className="bg-background border-border border-b lg:hidden">
          <div className="flex flex-col">
            <div className="flex-grow overflow-y-auto p-2">
              <div className="flex flex-col">
                <NavItems isMobile={true} />
              </div>
            </div>
            <Separator />
            <div className="p-2">
              <div className="flex items-center space-x-3 p-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-muted-foreground text-sm">hi@shadcndesign.com</p>
                </div>
              </div>
              <div>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  My profile
                </Link>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  Account settings
                </Link>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  Billing
                </Link>
                <Link href="#" className="text-muted-foreground block rounded-md px-2 py-2 font-medium">
                  Sign out
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Page Header

function PageHeader3() {
  return (
    <div className="bg-background border-border border-b pb-4 pt-0 md:pb-6">
      <nav className="border-border mb-6 border-b">
        <div className="container mx-auto flex overflow-x-auto px-2 lg:px-3.5">
          <Link href="#" className="text-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">Profile</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">Account</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">Analytics</span>
          </Link>
          <Link href="#" className="border-primary text-foreground flex-shrink-0 border-b-2 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">API</span>
          </Link>
          <Link href="#" className="text-muted-foreground flex-shrink-0 py-1.5 text-sm">
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">Members</span>
          </Link>
        </div>
      </nav>
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">API Settings</h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Configure your API settings. Add, remove or edit existing API keys.
            </p>
          </div>

          <div>
            <Button variant="outline">Contact support</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Settings5() {
  return (
    <div className="bg-background">
      <Navbar1 />
      <PageHeader3 />
      <main>
        <div className="container mx-auto flex flex-col gap-6 p-4 lg:gap-8 lg:p-6">
          <section className="flex flex-col gap-4 lg:gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Your plan</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Manage or upgrade your plan.</p>
            </div>

            {/* Plan Summary */}
            <Card>
              <CardHeader className="px-4 pb-0 pt-4 lg:px-6 lg:pt-6">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Plan Summary</span>
                  </CardTitle>
                  <Badge variant="secondary">Free Plan</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">100 credits left</span>
                  </div>
                  <Progress value={50} className="h-4" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Price/Month</p>
                    <p className="font-semibold">$0</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Included Credits</p>
                    <p className="font-semibold">200</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Renewal Date</p>
                    <p className="font-semibold">Oct 3, 2024</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted flex justify-end rounded-b-lg border-t px-4 py-4 lg:px-6">
                <Button>
                  Upgrade plan <ExternalLink />
                </Button>
              </CardFooter>
            </Card>
          </section>
          <Separator />
          {/* Invoices */}
          <section className="flex flex-col gap-4 lg:gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Invoices</h2>
              <p className="text-muted-foreground text-sm lg:text-base">
                Manage your invoices, billing, and payment details effortlessly.
              </p>
            </div>
            <div className="flex flex-col justify-between md:flex-row">
              <div className="relative mb-2 md:mb-0 md:w-64">
                <Search
                  className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 transform"
                  size={18}
                />
                <Input className="pl-10" placeholder="Search" />
              </div>
              <Button variant="outline">
                <Download /> Download all
              </Button>
            </div>
            <div className="overflow-hidden rounded-md border">
              <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader className="h-12">
                    <TableRow>
                      <TableHead className="text-foreground w-10 pt-1">
                        <Checkbox />
                      </TableHead>
                      <TableHead className="text-foreground">Invoice</TableHead>
                      <TableHead className="text-foreground hidden md:table-cell">Billing date</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">Plan</TableHead>
                      <TableHead className="text-foreground w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: 2,
                        date: 'Sep 5, 2024 8:50',
                        status: 'Paid',
                        plan: 'Basic plan',
                      },
                      {
                        id: 5,
                        date: 'Aug 26, 2024 3:1',
                        status: 'Paid',
                        plan: 'Basic plan',
                      },
                      {
                        id: 4,
                        date: 'Sep 18, 2024 9:5',
                        status: 'Paid',
                        plan: 'Basic plan',
                      },
                      {
                        id: 3,
                        date: 'Sep 11, 2024 3:26',
                        status: 'Paid',
                        plan: 'Business plan',
                      },
                      {
                        id: 1,
                        date: 'Sep 19, 2024 2:3',
                        status: 'Paid',
                        plan: 'Basic plan',
                      },
                    ].map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="pt-5">
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">Invoice #{invoice.id}</TableCell>
                        <TableCell className="hidden md:table-cell">{invoice.date}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.plan}</TableCell>
                        <TableCell>...</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-muted flex items-center justify-end border-t p-4">
                <Pagination className="hidden justify-end md:flex">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        2
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="flex items-center justify-end space-x-2 md:hidden">
                  <Button variant="outline">Previous</Button>
                  <Button variant="outline">Next</Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
