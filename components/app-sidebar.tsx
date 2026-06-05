"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Gauge,
  Command,
  Layers,
  TvMinimal,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import type { SessionUser } from "@/lib/auth-constants"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar"
import { TooltipProvider } from "./ui/tooltip"

const data = {
  navMain: [
    { 
      title: "Dashboard",
      url: "/dashboard",
      icon: Gauge,
    },
    {
      title: "Manajemen Data",
      url: "/manajemen",
      icon: Layers,
      items: [
        {
          title: "Rumah",
          url: "/manajemen/rumah",
        },
        {
          title: "User",
          url: "/manajemen/user",
        },
        {
          title: "Perangkat",
          url: "/manajemen/perangkat",
        },
      ],
    },
    {
      title: "Monitoring",
      url: "/monitoring",
      icon: TvMinimal,
      items: [
        {
          title: "Realtime",
          url: "/monitoring/realtime",
        },
        {
          title: "Riwayat Pemakaian",
          url: "/monitoring/riwayat-pemakaian",
        },
      ],
    },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SessionUser
}) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">WattWise</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} activePath={pathname} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              name: user.username,
              email: user.email,
              avatar: "/avatars/shadcn.svg",
            }}
          />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
