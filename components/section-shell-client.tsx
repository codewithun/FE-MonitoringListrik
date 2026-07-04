"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
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

type AdminTheme = "light" | "dark"

const ADMIN_THEME_STORAGE_KEY = "wattwise-admin-theme"

function getInitialAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light"

  const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)

  return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light"
}

const LIGHT_ADMIN_THEME = {
  "--background": "#F8FAFC",
  "--foreground": "#0F172A",
  "--card": "#FFFFFF",
  "--card-foreground": "#0F172A",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#0F172A",
  "--primary": "#2563EB",
  "--primary-foreground": "#FFFFFF",
  "--secondary": "#EFF6FF",
  "--secondary-foreground": "#1E3A8A",
  "--muted": "#F1F5F9",
  "--muted-foreground": "#64748B",
  "--accent": "#EFF6FF",
  "--accent-foreground": "#1E3A8A",
  "--destructive": "#DC2626",
  "--border": "#E2E8F0",
  "--input": "#E2E8F0",
  "--ring": "#2563EB",
  "--chart-1": "#2563EB",
  "--chart-2": "#16A34A",
  "--chart-3": "#DC2626",
  "--chart-4": "#7C3AED",
  "--chart-5": "#F59E0B",
  "--sidebar": "#FFFFFF",
  "--sidebar-foreground": "#0F172A",
  "--sidebar-primary": "#2563EB",
  "--sidebar-primary-foreground": "#FFFFFF",
  "--sidebar-accent": "#EFF6FF",
  "--sidebar-accent-foreground": "#1E3A8A",
  "--sidebar-border": "#E2E8F0",
  "--sidebar-ring": "#2563EB",
} as CSSProperties

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
  const [adminTheme, setAdminTheme] =
    useState<AdminTheme>(getInitialAdminTheme)

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

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, adminTheme)
    document.documentElement.classList.toggle("dark", adminTheme === "dark")

    return () => {
      document.documentElement.classList.add("dark")
    }
  }, [adminTheme])

  const adminThemeStyle =
    adminTheme === "light" ? LIGHT_ADMIN_THEME : undefined

  return (
    <SidebarProvider style={adminThemeStyle}>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 text-foreground">
          <div className="flex min-w-0 items-center gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={
              adminTheme === "light"
                ? "Aktifkan dark mode"
                : "Aktifkan light mode"
            }
            onClick={() =>
              setAdminTheme((current) =>
                current === "light" ? "dark" : "light"
              )
            }
            className="shrink-0"
          >
            {adminTheme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </Button>
        </header>
        <div className="relative flex flex-1 flex-col bg-background text-foreground">
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
