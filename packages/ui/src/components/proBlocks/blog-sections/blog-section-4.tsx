'use client'

import { AspectRatio } from '@repo/ui/components/aspect-ratio'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import Image from 'next/image'

interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  image: string
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'Getting Started with shadcn/ui: A Complete Guide',
    date: 'Mar 15, 2024',
    category: 'Tutorial',
    image: 'https://ui.shadcn.com/placeholder.svg',
  },
  {
    id: 2,
    title: 'Building Dark Mode with Next.js and Tailwind CSS',
    date: 'Mar 12, 2024',
    category: 'Development',
    image: 'https://ui.shadcn.com/placeholder.svg',
  },
  {
    id: 3,
    title: 'Mastering React Server Components',
    date: 'Mar 8, 2024',
    category: 'Advanced',
    image: 'https://ui.shadcn.com/placeholder.svg',
  },
  {
    id: 4,
    title: 'The Future of Web Development in 2024',
    date: 'Mar 5, 2024',
    category: 'Insights',
    image: 'https://ui.shadcn.com/placeholder.svg',
  },
]

export function BlogSection4() {
  return (
    <section className="bg-muted/40 py-16 md:py-24" aria-labelledby="blog-section-4-heading">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-8 md:gap-12 lg:flex-row">
          <div className="flex max-w-lg flex-1 flex-col gap-6 lg:gap-8">
            <div className="flex flex-col gap-5">
              <p className="text-muted-foreground text-sm font-semibold md:text-base">Blog section</p>
              <h2 className="text-3xl font-bold md:text-4xl">Short and clear engaging headline for a blog</h2>
              <p className="text-muted-foreground text-base">
                Add a concise value statement that captures reader interest and previews content value. Focus on
                benefits while keeping it under two lines. Align with your blog categories.
              </p>
            </div>
            <Button variant="outline" className="w-fit">
              View all articles
            </Button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" role="list">
            {BLOG_POSTS.map(post => (
              <Card key={post.id} className="group cursor-pointer overflow-hidden" role="listitem">
                <AspectRatio ratio={4 / 3} className="overflow-hidden">
                  <Image
                    src={post.image}
                    alt={`${post.title} thumbnail`}
                    fill
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </AspectRatio>
                <CardContent className="flex flex-col justify-between gap-4 p-6">
                  <h3 className="text-base font-semibold">{post.title}</h3>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm leading-none">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.category}</span>
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
