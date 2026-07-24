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
      url: "/admin/dashboard",
      icon: Gauge,
    },
    {
      title: "Manajemen Data",
      url: "/admin/manajemen",
      icon: Layers,
      items: [
        {
          title: "User",
          url: "/admin/manajemen/user",
        },
        {
          title: "Rumah",
          url: "/admin/manajemen/rumah",
        },
        {
          title: "Tarif Listrik",
          url: "/admin/manajemen/tarif-listrik",
        },
      ],
    },
    {
      title: "Perangkat",
      url: "/admin/manajemen/perangkat",
      icon: Cpu,
      items: [
        {
          title: "Data Perangkat",
          url: "/admin/manajemen/perangkat",
        },
        {
          title: "Penjadwalan",
          url: "/admin/manajemen/perangkat/penjadwalan",
        },
        {
          title: "Pengaturan Daya",
          url: "/admin/manajemen/perangkat/pengaturan-daya",
        },
      ],
    },
    {
      title: "Monitoring",
      url: "/admin/monitoring",
      icon: TvMinimal,
      items: [
        {
          title: "Data Listrik",
          url: "/admin/monitoring/realtime",
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
                <Link href="/admin/dashboard" onClick={showNavigationLoading}>
                  <div className="flex aspect-square size-10 items-center justify-center rounded-lg overflow-hidden">
                    <img src="/logo.png" alt="WattWise" className="h-full w-full object-contain" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold tracking-tight"><span className="text-blue-600">Watt</span><span className="text-yellow-500">Wise</span></span>
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
