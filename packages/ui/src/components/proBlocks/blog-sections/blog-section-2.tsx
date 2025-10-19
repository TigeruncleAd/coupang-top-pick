'use client'

import { Card, CardContent, CardFooter } from '@repo/ui/components/card'
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar'
import { Separator } from '@repo/ui/components/separator'

interface BlogPost {
  id: number
  title: string
  description: string
  date: string
  category: string
  author: string
  authorImage: string
  authorRole: string
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'Getting Started with shadcn/ui: A Complete Guide',
    description:
      "Learn how to set up and maximize your development workflow with shadcn/ui's powerful component library.",
    date: 'Mar 15, 2024',
    category: 'Tutorial',
    author: 'John Doe',
    authorImage: 'https://github.com/shadcn.png',
    authorRole: 'Developer',
  },
  {
    id: 2,
    title: 'Building Dark Mode with Next.js and Tailwind CSS',
    description: 'Implement a seamless dark mode toggle in your Next.js application using Tailwind CSS and shadcn/ui.',
    date: 'Mar 12, 2024',
    category: 'Development',
    author: 'Jane Smith',
    authorImage: 'https://github.com/shadcn.png',
    authorRole: 'Designer',
  },
  {
    id: 3,
    title: 'Mastering React Server Components',
    description:
      "Deep dive into React Server Components and learn how they can improve your application's performance.",
    date: 'Mar 8, 2024',
    category: 'Advanced',
    author: 'Alice Johnson',
    authorImage: 'https://github.com/shadcn.png',
    authorRole: 'Developer',
  },
]

export function BlogSection2() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="blog-section-2-heading">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-start gap-12">
          {/* Section Header */}
          <div className="flex max-w-xl flex-col items-start gap-4 text-left md:gap-5">
            {/* Category Tag */}
            <p className="text-muted-foreground text-base font-semibold md:text-sm">Blog section</p>

            {/* Main Title */}
            <h2 id="blog-section-2-heading" className="text-3xl font-bold leading-tight md:text-4xl">
              Short and clear engaging headline for a blog
            </h2>

            {/* Section Description */}
            <p className="text-muted-foreground text-base">
              Add a concise value statement that captures reader interest and previews content value. Focus on benefits
              while keeping it under two lines. Align with your blog categories.
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6" role="list">
            {BLOG_POSTS.map((post, index) => (
              <>
                <Card
                  key={post.id}
                  className="group flex cursor-pointer flex-col justify-between rounded-none border-none shadow-none"
                  role="listitem">
                  {/* Post Content */}
                  <CardContent className="flex flex-col gap-3 p-0">
                    {/* Post Meta */}
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-muted-foreground text-sm">{post.date}</span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-muted-foreground text-sm">{post.category}</span>
                    </div>

                    {/* Post Title */}
                    <h3 className="text-base font-semibold leading-normal hover:underline">{post.title}</h3>

                    {/* Post Summary */}
                    <p className="text-muted-foreground text-sm leading-normal">{post.description}</p>
                  </CardContent>

                  {/* Author Info */}
                  <CardFooter className="mt-4 flex items-center gap-2 p-0 md:mt-6">
                    {/* Author Avatar */}
                    <Avatar>
                      <AvatarImage src={post.authorImage} />
                      <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                    </Avatar>

                    {/* Author Details */}
                    <div className="flex flex-1 flex-col items-start gap-0">
                      <p className="text-foreground text-sm font-medium">{post.author}</p>
                      <p className="text-muted-foreground text-sm">{post.authorRole}</p>
                    </div>
                  </CardFooter>
                </Card>
                {index < BLOG_POSTS.length - 1 && <Separator className="lg:hidden" />}
              </>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
