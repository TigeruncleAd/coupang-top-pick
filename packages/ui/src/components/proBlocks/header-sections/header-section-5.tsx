'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/ui/components/breadcrumb'

export function HeaderSection5() {
  return (
    <section className="bg-background pb-16 pt-4 lg:pb-24" aria-labelledby="page-heading">
      <div className="container relative z-10 mx-auto flex flex-col gap-8 px-6 lg:gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb aria-label="Page navigation">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Header Sections</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Header Section Five</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Content */}
        <div className="flex max-w-xl flex-1 flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-sm font-semibold lg:text-base" aria-hidden="true">
              Header section
            </p>
            {/* Main Title */}
            <h1 id="page-heading" className="text-foreground text-3xl font-bold md:text-5xl">
              Short engaging headline
            </h1>
            {/* Section Description */}
            <p className="text-muted-foreground text-base lg:text-lg" aria-description="page description">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit interdum hendrerit ex vitae sodales.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
