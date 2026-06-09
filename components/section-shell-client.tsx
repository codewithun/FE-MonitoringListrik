"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SpinnerCustom } from "@/components/ui/spinner"
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
  const previousPathname = useRef(pathname)
  const hideLoadingTimeout = useRef<number | null>(null)
  const [isRouteSettling, setIsRouteSettling] = useState(false)

  const scheduleHideLoading = useCallback((delay = 300) => {
    if (hideLoadingTimeout.current) {
      window.clearTimeout(hideLoadingTimeout.current)
    }

    hideLoadingTimeout.current = window.setTimeout(() => {
      setIsRouteSettling(false)
    }, delay)
  }, [])

  useEffect(() => {
    return () => {
      if (hideLoadingTimeout.current) {
        window.clearTimeout(hideLoadingTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    const showLoading = () => {
      setIsRouteSettling(true)
      scheduleHideLoading(350)
    }

    window.addEventListener("app:navigation-start", showLoading)

    return () => {
      window.removeEventListener("app:navigation-start", showLoading)
    }
  }, [scheduleHideLoading])

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname
      setIsRouteSettling(true)
      scheduleHideLoading(300)
    }
  }, [pathname, scheduleHideLoading])

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
        <div className="relative flex flex-1 flex-col">
          {isRouteSettling ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <SpinnerCustom />
            </div>
          ) : null}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
