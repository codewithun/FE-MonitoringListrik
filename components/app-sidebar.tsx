"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Gauge,
  Command,
  Layers,
  TvMinimal,
  Cpu,
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

function showNavigationLoading(event: React.MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  window.dispatchEvent(new Event("app:navigation-start"))
}

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
          title: "User",
          url: "/manajemen/user",
        },
        {
          title: "Rumah",
          url: "/manajemen/rumah",
        },
        {
          title: "Tarif Listrik",
          url: "/manajemen/tarif-listrik",
        },
      ],
    },
    {
      title: "Perangkat",
      url: "/manajemen/perangkat",
      icon: Cpu,
      items: [
        {
          title: "Data Perangkat",
          url: "/manajemen/perangkat",
        },
        {
          title: "Penjadwalan",
          url: "/manajemen/perangkat/penjadwalan",
        },
        {
          title: "Pengaturan Daya",
          url: "/manajemen/perangkat/pengaturan-daya",
        },
      ],
    },
    {
      title: "Monitoring",
      url: "/monitoring",
      icon: TvMinimal,
      items: [
        {
          title: "Data Listrik",
          url: "/monitoring/realtime",
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
                <Link href="/dashboard" onClick={showNavigationLoading}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">WattWise</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </Link>
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
