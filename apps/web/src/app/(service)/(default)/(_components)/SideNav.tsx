'use client'

import {
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  ShoppingCartIcon,
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ListBulletIcon,
  UserGroupIcon,
  UserIcon,
  SunIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@repo/ui/components/sidebar'

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@repo/ui/components/collapsible'

import clsx from 'clsx'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PATH } from '../../../../../consts/const'
import { LICENSE_TYPE, ROLE } from '@repo/database'
import { useMemo } from 'react'
import { useMe } from '../../../../../hooks/useMe'
import { ToolSwitcher } from './ToolSwitcher'

import Image from 'next/image'
import {
  Bot,
  Inbox,
  Home,
  Sparkles,
  Search,
  SquareTerminal,
  LogOutIcon,
  BarChart3,
  ShoppingCart,
  Package,
  CheckCircle,
  FolderOpen,
  Settings,
  Bell,
  ChevronRight,
  GemIcon,
  Download,
  TrendingUp,
  BotIcon,
} from 'lucide-react'
import { SERVICE_TOOLS } from '@/consts/service'

interface NavItem {
  title: string
  url: string
  icon?: any
  items?: NavItem[]
}

// const navigationA: NavItem[] = [
//   {
//     name: '쇼핑몰 수집',
//     href: PATH.SEARCH_MALL,
//     icon: CheckCircleIcon,
//     current: false,
//   },
//   {
//     name: '상품 매칭',
//     href: PATH.MATCH_TAOBAO,
//     icon: CircleStackIcon,
//     current: false,
//   },
//   {
//     name: '수집된 상품',
//     href: PATH.PRODUCT,
//     icon: ShoppingCartIcon,
//     current: false,
//   },
// ]

// const navigationS: NavItem[] = [
//   {
//     name: '상품 업로드',
//     href: PATH.UPLOAD_PRODUCT,
//     icon: SunIcon,
//     current: false,
//   },
//   {
//     name: '업로드한 상품 관리',
//     href: PATH.MANAGE_UPLOAD_PRODUCT,
//     icon: SunIcon,
//     current: false,
//   },
//   {
//     name: '설정',
//     href: PATH.SETTING,
//     icon: Cog6ToothIcon,
//     current: false,
//   },
// ]

// const navigationAdmin: NavItem[] = [
//   {
//     name: '사용자 관리',
//     href: PATH.USER,
//     icon: UserGroupIcon,
//     current: false,
//   },
//   {
//     name: '쇼핑몰 블랙리스트',
//     href: PATH.MALL_BLACKLIST,
//     icon: UserGroupIcon,
//     current: false,
//   },
// ]

// 대시보드, 쇼핑몰 수집, 상품 수집, 상품 매칭, 상품관리, 설정, 공지사항
const agencyNavMain: NavItem[] = [
  {
    title: '대시보드',
    url: PATH.AGENCY_DASHBOARD,
    icon: BarChart3,
  },
  // {
  //   title: '상품 BEST 수집',
  //   url: PATH.AGENCY_AI_SOURCING_KEYWORD_SOURCING,
  //   icon: GemIcon,
  // },
  // {
  //   title: '타오바오 매칭',
  //   url: PATH.AGENCY_PRODUCT_MATCHING,
  //   icon: CheckCircle,
  // },
  {
    title: 'AI 소싱',
    url: PATH.AGENCY_AI_SOURCING,
    icon: BotIcon,
    items: [
      {
        title: '키워드 소싱',
        url: PATH.AGENCY_AI_SOURCING_KEYWORD_SOURCING,
        icon: ShoppingCart,
      },
      {
        title: '타오바오 매칭',
        url: PATH.AGENCY_AI_SOURCING_PRODUCT_MATCHING,
        icon: CheckCircle,
      },
    ],
  },
  // {
  //   title: '핸드픽 소싱',
  //   url: PATH.AGENCY_HANDPICK_SOURCING,
  //   icon: FaceSmileIcon,
  // },
  {
    title: '상품 등록',
    url: PATH.AGENCY_PRODUCTS,
    // icon: FolderOpen,
    icon: Package,
  },
  {
    title: '설정',
    url: PATH.AGENCY_SETTINGS,
    icon: Settings,
  },
  {
    title: '공지사항',
    url: PATH.AGENCY_NOTICES,
    icon: Bell,
  },
]

const analyzeNavMain: NavItem[] = [
  {
    title: '홈',
    url: PATH.ANALYZE_HOME,
    icon: Home,
  },
  {
    title: '아이템 발굴',
    url: PATH.ANALYZE_ITEM_EXPLORATION,
    icon: Search,
  },
  {
    title: '랭킹 추적',
    url: PATH.ANALYZE_RANKING_TRACE,
    icon: TrendingUp,
  },
  {
    title: '키워드 분석',
    url: PATH.ANALYZE_KEYWORD,
    icon: BarChart3,
  },
  {
    title: 'HTML 덤프',
    url: PATH.ANALYZE_HTML_DUMP,
    icon: Download,
  },
  // {
  //   title: '키워드 트렌드',
  //   url: PATH.ANALYZE_TREND,
  //   icon: TrendingUp,
  // },
  {
    title: '데이터 관리',
    url: PATH.ANALYZE_DATA_MANAGEMENT,
    icon: Package,
  },
  {
    title: '공지사항',
    url: PATH.ANALYZE_NOTICES,
    icon: Bell,
  },
]

const blogNavMain: NavItem[] = [
  {
    title: '홈',
    url: PATH.BLOG_HOME,
    icon: Home,
  },
  {
    title: '대시보드',
    url: PATH.BLOG_DASHBOARD,
    icon: BarChart3,
  },
  {
    title: '블로그 지수 측정',
    url: PATH.BLOG_INDEX_MEASUREMENT,
    icon: BarChart3,
  },
]

// 1. 해외구매대행 소싱 툴
// 2. 키워드 분석 툴
// 3. 블로그 툴

export default function SideNav({ ...props }) {
  const pathname = usePathname()
  const { me, status } = useMe()
  const license = me?.license
  const role = me?.role

  const isAgency = pathname?.startsWith('/agency') || pathname === '/'
  const isAnalyze = pathname?.startsWith('/analyze')
  const isBlog = pathname?.startsWith('/blog')

  // const nav = useMemo(() => {
  //   let newNav = navigationA
  //   if (license === LICENSE_TYPE.S) {
  //     newNav = [...newNav, ...navigationS]
  //   }

  //   if (role === ROLE.ADMIN) {
  //     newNav = [...newNav, ...navigationAdmin]
  //   }

  //   return newNav
  // }, [me])

  const defaultTool = isAgency
    ? SERVICE_TOOLS[0]
    : isAnalyze
      ? SERVICE_TOOLS[1]
      : isBlog
        ? SERVICE_TOOLS[2]
        : SERVICE_TOOLS[0]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="#">
                {/* <IconInnerShadowTop className="!size-5" /> */}
                {/* <Image src="/images/logo/titan-logo.webp" alt="타이탄 툴즈" width={20} height={20} /> */}
                <span className="text-base font-semibold">셀로직 - SELLOGIC</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ToolSwitcher tools={SERVICE_TOOLS} defaultTool={defaultTool as string} />
      </SidebarHeader>
      <SidebarContent>
        {isAgency && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu className="gap-y-2">
              {agencyNavMain.map(item => {
                const isActive = pathname?.startsWith(item.url)

                if (item.items) {
                  return (
                    <Collapsible key={item.title} asChild defaultOpen={true} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={clsx(
                              // isActive ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700 ' : ''
                              'h-10 w-full gap-x-3 text-lg font-bold',
                            )}>
                            {item.icon && <item.icon />}
                            <span className="text-lg font-bold">{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="gap-y-2">
                            {item.items?.map(subItem => {
                              const isSubActive = pathname?.startsWith(subItem.url)

                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link
                                      href={subItem.url}
                                      className={clsx(
                                        isSubActive
                                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700'
                                          : '',
                                        'h-8',
                                      )}>
                                      <span className="text-lg font-bold">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10 w-full gap-x-3">
                      <Link
                        href={item.url}
                        className={clsx(
                          isActive ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700' : '',
                          'text-lg font-bold',
                        )}>
                        <item.icon size={40} />
                        <span className="text-lg font-bold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {isAnalyze && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu className="gap-y-2">
              {analyzeNavMain.map(item => {
                const isActive = pathname?.startsWith(item.url)

                if (item.items) {
                  return (
                    <Collapsible key={item.title} asChild defaultOpen={true} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={clsx(
                              // isActive ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700 ' : ''
                              'h-10 w-full gap-x-3 text-lg font-bold',
                            )}>
                            {item.icon && <item.icon />}
                            <span className="text-lg font-bold">{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="gap-y-2">
                            {item.items?.map(subItem => {
                              const isSubActive = pathname?.startsWith(subItem.url)

                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link
                                      href={subItem.url}
                                      className={clsx(
                                        isSubActive
                                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700'
                                          : '',
                                        'h-8',
                                      )}>
                                      <span className="text-lg font-bold">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10 w-full gap-x-3">
                      <Link
                        href={item.url}
                        className={clsx(
                          isActive ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700' : '',
                          'text-lg font-bold',
                        )}>
                        <item.icon size={40} />
                        <span className="text-lg font-bold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {isBlog && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu className="gap-y-2">
              {blogNavMain.map(item => {
                const isActive = pathname?.startsWith(item.url)
                console.log('isActive', isActive)
                console.log('item.url', item.url)
                console.log('pathname', pathname)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10 w-full gap-x-3">
                      <Link
                        href={item.url}
                        className={clsx(
                          isActive ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-700' : '',
                          'text-lg font-bold',
                        )}>
                        <item.icon size={40} />
                        <span className="text-lg font-bold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-10 w-full gap-x-3 text-lg font-bold"
                onClick={() => signOut({ callbackUrl: PATH.SIGNIN })}>
                <LogOutIcon size={40} />
                <span>로그아웃</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
