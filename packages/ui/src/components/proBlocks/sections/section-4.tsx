'use client'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { ArrowLeft, ArrowRight, Search, ListFilter, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table'

const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card',
  },
]

export function Section4() {
  return (
    <div className="bg-background">
      {' '}
      {/* Add border border-border shadow-sm and rounded-lg class to make this section look like a card */}
      {/* Section header */}
      <div className="bg-background container mx-auto flex w-full flex-col justify-between gap-6 px-6 pt-6 lg:flex-row">
        {/* Title and description */}
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-lg  font-semibold leading-7 lg:text-xl">Table name</h2>
          <p className="text-muted-foreground text-sm leading-5">
            Read and write directly to databases and stores from your projects.
          </p>
        </div>

        {/* Search and buttons */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative order-2 w-full lg:order-1 lg:max-w-[280px]">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input className="h-10 pl-9" type="search" placeholder="Search" />
          </div>
          <div className="order-1 flex gap-3 lg:order-2">
            <Button variant="outline" className="order-2 lg:order-1">
              <ListFilter className="h-4 w-4" />
              Filters
            </Button>
            <Button className="order-1 lg:order-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>
      </div>
      {/* Section body */}
      <div className="container mx-auto px-4 py-6 lg:px-6">
        <Table className="w-full min-w-[480px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className="text-right">{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Section footer */}
      <div className="border-border border-t py-4">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 lg:px-6">
          <Button variant="outline" className="w-10 md:min-w-[112px]">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:block">Previous</span>
          </Button>
          <span className="text-muted-foreground text-center text-sm">
            <span className="text-foreground font-medium">1-7</span> of 120
          </span>
          <Button variant="outline" className="w-10 md:min-w-[112px]">
            <span className="hidden md:block">Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
