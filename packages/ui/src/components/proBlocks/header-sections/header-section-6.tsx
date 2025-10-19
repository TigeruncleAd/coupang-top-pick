'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/ui/components/breadcrumb'

export function HeaderSection6() {
  return (
    <section className="bg-zinc-950 pb-16 pt-4 lg:pb-24" aria-labelledby="page-heading">
      <div className="container relative z-10 mx-auto flex flex-col gap-8 px-6 lg:gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb aria-label="Page navigation">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="text-white/80">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/50" />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="text-white/80">
                Header Sections
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white/90">Header Section Six</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Content */}
        <div className="flex max-w-xl flex-1 flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Category Tag */}
            <p className="text-sm font-semibold text-white/80 lg:text-base" aria-hidden="true">
              Header section
            </p>
            {/* Main Title */}
            <h1 id="page-heading" className="text-3xl font-bold text-white md:text-5xl">
              Short engaging headline
            </h1>
            {/* Section Description */}
            <p className="text-base text-white/80 lg:text-lg" aria-description="page description">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit interdum hendrerit ex vitae sodales.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
