'use client'

import * as React from 'react'
import {
  Check,
  ChevronsUpDown,
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Plane,
  Settings2,
  SquareTerminal,
  Container,
  Newspaper,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@repo/ui/components/sidebar'
import { PATH } from '@/consts/const'
import { useRouter } from 'next/navigation'

const toolsMap = {
  SHIPPING_AGENCY: {
    name: '해외구매대행',
    logo: <Container className="size-4" />,
    path: PATH.AGENCY_DASHBOARD,
    color: 'bg-blue-500 text-white',
  },
  KEYWORD_ANALYZE: {
    name: '키워드 분석',
    logo: <PieChart className="size-4" />,
    path: PATH.ANALYZE_HOME,
    color: 'bg-purple-500 text-white',
  },
  BLOG_TOOL: {
    name: '블로그',
    logo: <Newspaper className="size-4" />,
    path: PATH.BLOG_HOME,
    color: 'bg-green-500 text-white',
  },
}

export function ToolSwitcher({ tools, defaultTool }: { tools: string[]; defaultTool: string }) {
  const [selectedTool, setSelectedTool] = React.useState(defaultTool)
  const router = useRouter()
  const currentTool = toolsMap[selectedTool]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors">
              <div className={`${currentTool.color} flex aspect-square size-8 items-center justify-center rounded-lg`}>
                {/* <GalleryVerticalEnd className="size-4" /> */}
                {currentTool.logo}
              </div>
              <div className="flex flex-col gap-0.5 text-base font-bold leading-none">
                {/* <span className="font-medium">{selectedTool}</span> */}
                <span className="">{currentTool.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={'right'}
            sideOffset={4}>
            {tools.map(tool => {
              const thisTool = toolsMap[tool]
              return (
                <DropdownMenuItem
                  key={tool}
                  onSelect={() => {
                    setSelectedTool(tool)
                    router.push(thisTool.path)
                  }}>
                  <div className="flex items-center gap-2">
                    {thisTool.logo}
                    {thisTool.name}
                  </div>
                  {tool === selectedTool && <Check className="ml-auto" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
