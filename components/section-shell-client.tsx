"use client"

import { Fragment, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import type { SessionUser } from "@/lib/auth-constants"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const sectionLabels: Record<string, { label: string; href: string }> = {
  dashboard: { label: "Dashboard", href: "/dashboard" },
  manajemen: { label: "Manajemen Data", href: "/manajemen" },
  monitoring: { label: "Monitoring", href: "/monitoring" },
  analisis: { label: "Analisis", href: "/analisis" },
  settings: { label: "Settings", href: "/settings" },
}

const sectionChildren: Record<string, Record<string, string>> = {
  manajemen: {
    rumah: "Rumah",
    user: "User",
    perangkat: "Perangkat",
  },
  monitoring: {
    realtime: "Realtime",
    "riwayat-pemakaian": "Riwayat Pemakaian",
  },
  analisis: {
    "prediksi-konsumsi": "Prediksi Konsumsi",
    laporan: "Laporan",
  },
  settings: {
    general: "General",
    team: "Team",
    billing: "Billing",
    limits: "Limits",
  },
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const [sectionSlug, childSlug] = segments

  if (!sectionSlug) {
    return [{ label: "Dashboard", href: "/dashboard", current: true }]
  }

  const section = sectionLabels[sectionSlug]

  if (!section) {
    return [{ label: pathname, href: pathname, current: true }]
  }

  if (sectionSlug === "dashboard") {
    return [{ label: section.label, href: section.href, current: true }]
  }

  if (!childSlug) {
    return [{ label: section.label, href: section.href, current: true }]
  }

  return [
    { label: section.label, href: section.href, current: false },
    {
      label: sectionChildren[sectionSlug]?.[childSlug] ?? childSlug,
      href: pathname,
      current: true,
    },
  ]
}

export function SectionShellClient({
  children,
  user,
}: {
  children: ReactNode
  user: SessionUser
}) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbItems(pathname)

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <Fragment key={item.label}>
                    <BreadcrumbItem>
                      {item.current ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 ? (
                      <BreadcrumbSeparator key={`${item.label}-separator`} />
                    ) : null}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
