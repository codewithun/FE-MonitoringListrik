"use client"

import * as React from "react"
import { Bell, History, Home, Moon, Plus, Smartphone, Sun, User } from "lucide-react"

import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { apiRequest, extractArray, getString } from "@/lib/api-client"
import type { SessionUser } from "@/lib/auth-constants"

import {
  type House,
  type Device,
  type ElectricityLog,
  type Prediction,
  type TabKey,
  type PwaTheme,
  type AddMode,
  type RelayStatus,
  getHousesFromUserPayload,
  houseBelongsToUser,
  idsMatch,
  mapDevice,
  mapElectricityLog,
  mapHouse,
  mapPrediction,
  getTabFromUrl,
} from "./pwa/types"
import { HomeTab } from "./pwa/home-tab"
import { PredictionTab } from "./pwa/prediction-tab"
import { HistoryTab } from "./pwa/history-tab"
import { AssistantBubble } from "./pwa/assistant-bubble"
import { AddTab } from "./pwa/add-tab"
import { ProfileTab } from "./pwa/profile-tab"
import { DeviceConfigDialog } from "./pwa/device-config-dialog"
import { NotificationPanel, type NotificationItem, type NotificationType } from "./pwa/notification-panel"

const LIGHT_PWA_THEME = {
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
} as React.CSSProperties

export function UserPwaApp({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("home")
  const [pwaTheme, setPwaTheme] = React.useState<PwaTheme>("light")

  const [houses, setHouses] = React.useState<House[]>([])
  const [devices, setDevices] = React.useState<Device[]>([])
  const [logs, setLogs] = React.useState<ElectricityLog[]>([])
  const [predictions, setPredictions] = React.useState<Prediction[]>([])

  const [selectedDeviceId, setSelectedDeviceId] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [avatar, setAvatar] = React.useState("")


  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [notifiedLog, setNotifiedLog] = React.useState<Record<string, number>>({}) // To prevent spam

  React.useEffect(() => {
    // Load from local storage on mount
    try {
      const stored = localStorage.getItem(`notifications_${user.id}`)
      if (stored) {
        setNotifications(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [user.id])

  React.useEffect(() => {
    // Save to local storage when changed
    if (notifications.length > 0 || localStorage.getItem(`notifications_${user.id}`)) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications))
    }
  }, [notifications, user.id])

  const addNotification = React.useCallback((title: string, description: string, type: NotificationType = "info") => {
    const newNotif: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      type,
      timestamp: new Date().toISOString(),
      read: false
    }

    setNotifications(prev => [newNotif, ...prev])

    if (type === "power_limit" || type === "schedule") {
      toast.warning(title, { description })
    } else if (type === "success") {
      toast.success(title, { description })
    } else {
      toast.info(title, { description })
    }
  }, [])
  const [addMode, setAddMode] = React.useState<AddMode>("device")

  const [configDevice, setConfigDevice] = React.useState<Device | null>(null)
  const [isConfigDeviceOpen, setIsConfigDeviceOpen] = React.useState(false)

  React.useEffect(() => {
    setActiveTab(getTabFromUrl())
  }, [])

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("wattwise-pwa-theme")
    if (savedTheme === "light" || savedTheme === "dark") {
      setPwaTheme(savedTheme)
    }
  }, [])

  React.useEffect(() => {
    const cached = window.localStorage.getItem(`avatar_${user.id}`)
    if (cached) setAvatar(cached)
    
    apiRequest("/api/users").then(payload => {
      const users = extractArray(payload) as Record<string, any>[]
      const me = users.find(u => u.id === user.id)
      if (me?.avatar) {
        setAvatar(me.avatar)
        window.localStorage.setItem(`avatar_${user.id}`, me.avatar)
      }
    }).catch(() => {})
  }, [user.id])

  React.useEffect(() => {
    window.localStorage.setItem("wattwise-pwa-theme", pwaTheme)
  }, [pwaTheme])

  const pwaThemeStyle = pwaTheme === "light" ? LIGHT_PWA_THEME : undefined

  const avatarInitials = user.username
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  const switchTab = React.useCallback((tab: TabKey) => {
    setActiveTab(tab)
    if (typeof window === "undefined") return
    const nextUrl = tab === "home" ? "/user" : `/user?tab=${tab}`
    window.history.replaceState(null, "", nextUrl)
  }, [])

  React.useEffect(() => {
    const syncTabFromHistory = () => {
      setActiveTab(getTabFromUrl())
    }
    window.addEventListener("popstate", syncTabFromHistory)
    return () => {
      window.removeEventListener("popstate", syncTabFromHistory)
    }
  }, [])

  const loadMainData = React.useCallback(async () => {
    try {
      const [userPayload, userListPayload, housePayload, devicePayload] =
        await Promise.all([
          apiRequest<unknown>(`/api/users/${user.id}`).catch(() => null),
          apiRequest<unknown>("/api/users").catch(() => null),
          apiRequest<unknown>("/api/rumah").catch(() => null),
          apiRequest<unknown>("/api/perangkat"),
        ])

      const userFromList = extractArray(userListPayload).find((item) =>
        idsMatch(getString(item, ["id", "id_pengguna", "pengguna_id"]), user.id)
      )
      const directUserHouses = getHousesFromUserPayload(userPayload)
      const listUserHouses = getHousesFromUserPayload(userFromList)
      const ownedHouses = extractArray(housePayload)
        .filter((item) => houseBelongsToUser(item, user))
        .map(mapHouse)
      const nextHouses = [
        ...directUserHouses,
        ...listUserHouses,
        ...ownedHouses,
      ].filter(
        (house, index, rows) =>
          house.id &&
          rows.findIndex((item) => idsMatch(item.id, house.id)) === index
      )
      const houseIds = new Set(nextHouses.map((house) => house.id))
      const houseNames = new Set(nextHouses.map((house) => house.name))
      const nextDevices = extractArray(devicePayload)
        .map(mapDevice)
        .filter(
          (device) =>
            houseIds.has(device.houseId) ||
            (device.houseName !== "-" && houseNames.has(device.houseName))
        )

      setHouses(nextHouses)
      setDevices(nextDevices)
      setSelectedDeviceId((current) =>
        nextDevices.some((device) => device.deviceId === current)
          ? current
          : nextDevices[0]?.deviceId || ""
      )
      setLogs((current) => (nextDevices.length > 0 ? current : []))
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data rumah dan perangkat."
      )
    }
  }, [user])

  const loadRealtime = React.useCallback(async () => {
    if (!selectedDeviceId) {
      setLogs([])
      return
    }

    const query = selectedDeviceId
      ? `?deviceId=${encodeURIComponent(selectedDeviceId)}&limit=10`
      : "?limit=10"

    try {
      const payload = await apiRequest<unknown>(`/api/data-listrik/history${query}`)
      setLogs(extractArray(payload).map(mapElectricityLog))
    } catch {
      // Ignore background poll errors
    }
  }, [selectedDeviceId])

  const loadPrediction = React.useCallback(async () => {
    if (houses.length === 0) {
      setPredictions([])
      return
    }

    try {
      const payload = await apiRequest<unknown>("/api/prediksi-bulanan")
      const houseIds = new Set(houses.map((house) => house.id))
      const nextPredictions = extractArray(payload)
        .map(mapPrediction)
        .filter(
          (item) =>
            (!item.houseId || houseIds.has(item.houseId)) &&
            (!item.deviceId || item.deviceId === selectedDeviceId)
        )

      setPredictions(nextPredictions)
    } catch {
      setPredictions([])
    }
  }, [houses, selectedDeviceId])

  React.useEffect(() => {
    void Promise.resolve().then(loadMainData)
  }, [loadMainData])

  React.useEffect(() => {
    void Promise.resolve().then(loadPrediction)
  }, [loadPrediction])

  React.useEffect(() => {
    void Promise.resolve().then(loadRealtime)
    const intervalId = window.setInterval(() => {
      void loadRealtime()
    }, 2500)
    return () => window.clearInterval(intervalId)
  }, [loadRealtime])

  // ================= NOTIFICATION CHECKER =================
  React.useEffect(() => {
    if (devices.length === 0) return

    const now = new Date()
    const nowMs = now.getTime()
    
    devices.forEach((device) => {
      const lockKeyLimit = `power_${device.deviceId}`
      const lockKeySchedule = `schedule_${device.deviceId}`

      // 1. Check Power Limit (Batas Daya)
      if (device.batasDayaAktif && device.batasDaya && device.batasDaya > 0) {
        // Find latest log for this device
        const deviceLogs = logs.filter(l => l.deviceId === device.deviceId)
        if (deviceLogs.length > 0) {
          const latestPower = deviceLogs[0].power
          if (latestPower >= device.batasDaya * 0.9) {
            // Reached 90% or more
            const lastNotified = notifiedLog[lockKeyLimit] || 0
            const tenMinutes = 10 * 60 * 1000
            
            if (nowMs - lastNotified > tenMinutes) {
              addNotification(
                "Peringatan Batas Daya!",
                `Perangkat ${device.name} telah mencapai ${latestPower}W (Batas: ${device.batasDaya}W).`,
                "power_limit"
              )
              setNotifiedLog(prev => ({ ...prev, [lockKeyLimit]: nowMs }))
            }
          }
        }
      }

      // 2. Check Schedule (Penjadwalan)
      if (device.jadwalAktif && device.jadwalTanggal && device.jadwalWaktu) {
        try {
          const scheduleDateTime = new Date(`${device.jadwalTanggal}T${device.jadwalWaktu}`)
          if (!isNaN(scheduleDateTime.getTime())) {
            const timeDiff = scheduleDateTime.getTime() - nowMs
            // If it's within the next 10 minutes (600,000 ms) and not passed
            if (timeDiff > 0 && timeDiff <= 10 * 60 * 1000) {
              const lastNotified = notifiedLog[lockKeySchedule] || 0
              // Only notify once per schedule setup (or once a day)
              // Since the timeDiff is narrow, we just prevent spamming within 30 mins
              if (nowMs - lastNotified > 30 * 60 * 1000) {
                const actionText = device.jadwalAksi === "OFF" ? "MATI" : "MENYALA"
                const minutesLeft = Math.ceil(timeDiff / 60000)
                addNotification(
                  "Jadwal Akan Berjalan",
                  `Perangkat ${device.name} akan otomatis ${actionText} dalam ${minutesLeft} menit.`,
                  "schedule"
                )
                setNotifiedLog(prev => ({ ...prev, [lockKeySchedule]: nowMs }))
              }
            }
          }
        } catch {
          // ignore invalid date parsing
        }
      }
    })
  }, [devices, logs, addNotification, notifiedLog])
  // ========================================================

  async function toggleRelay(device: Device, nextChecked: boolean) {
    setSelectedDeviceId(device.deviceId)

    const nextStatus: RelayStatus = nextChecked ? "ON" : "OFF"
    setDevices((current) =>
      current.map((item) =>
        item.deviceId === device.deviceId ? { ...item, relayStatus: nextStatus } : item
      )
    )

    try {
      await apiRequest("/api/relay-control", {
        method: "POST",
        body: JSON.stringify({
          device_id: device.deviceId,
          relay: nextChecked,
          status_relay: nextChecked,
        }),
      })
      await loadMainData()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal mengubah relay perangkat."
      )
      setDevices((current) =>
        current.map((item) =>
          item.deviceId === device.deviceId
            ? { ...item, relayStatus: nextChecked ? "OFF" : "ON" }
            : item
        )
      )
    }
  }

  const openAddFlow = () => {
    setAddMode("device")
    switchTab("add")
  }

  return (
    <main
      className="min-h-svh bg-background text-foreground"
      style={pwaThemeStyle}
    >
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col pb-24">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Buka profil"
                onClick={() => switchTab("profile")}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar size="lg">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
              </button>
              <div>
                <p className="text-sm text-muted-foreground">WattWise</p>
                <h1 className="text-xl font-semibold">Halo, {user.username}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  pwaTheme === "light" ? "Aktifkan dark mode" : "Aktifkan light mode"
                }
                onClick={() =>
                  setPwaTheme((current) =>
                    current === "light" ? "dark" : "light"
                  )
                }
                className="rounded-full"
              >
                {pwaTheme === "light" ? (
                  <Moon className="size-5" />
                ) : (
                  <Sun className="size-5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Pesan"
                onClick={() => setIsNotificationOpen(true)}
                className="relative rounded-full"
              >
                <Bell className="size-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {message ? (
          <div className="px-4 pt-4">
            <div className="rounded-md border bg-card px-3 py-2 text-sm">
              {message}
            </div>
          </div>
        ) : null}

        {activeTab === "home" ? (
          <HomeTab
            devices={devices}
            logs={logs}
            selectedDeviceId={selectedDeviceId}
            setSelectedDeviceId={setSelectedDeviceId}
            toggleRelay={toggleRelay}
            hasLinkedHouse={houses.length > 0}
            onConfigDevice={(device) => {
              setConfigDevice(device)
              setIsConfigDeviceOpen(true)
            }}
          />
        ) : null}

        {activeTab === "prediction" ? (
          <PredictionTab
            prediction={predictions.find(p => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear()) || predictions[0]}
            selectedDeviceId={selectedDeviceId}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryTab devices={devices} />
        ) : null}

        {activeTab === "add" ? (
          <AddTab
            initialMode={addMode}
            houses={houses}
            user={user}
            onSuccess={loadMainData}
            setMessage={setMessage}
          />
        ) : null}

        {activeTab === "profile" ? (
          <ProfileTab
            user={user}
            houses={houses}
            avatar={avatar}
            setAvatar={setAvatar}
            onSuccess={loadMainData}
            setMessage={setMessage}
            onAddHouseClick={() => {
              setAddMode("house")
              switchTab("add")
            }}
          />
        ) : null}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[100] border-t bg-white dark:bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {[
            { key: "home" as const, label: "Home", icon: Home },
            { key: "history" as const, label: "Riwayat", icon: History },
            { key: "add" as const, label: "Tambah", icon: Plus },
            { key: "prediction" as const, label: "Biaya", icon: Smartphone },
            { key: "profile" as const, label: "Profil", icon: User },
          ].map((item) => {
            const Icon = item.icon
            const isAdd = item.key === "add"
            const active = activeTab === item.key

            if (isAdd) {
              return (
                <div key={item.key} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => openAddFlow()}
                    className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                  >
                    <Icon className="size-6 stroke-[2.5]" />
                  </button>
                </div>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => switchTab(item.key)}
                className={`relative flex h-14 flex-col items-center justify-center text-[10px] transition-all duration-200 ${
                  active
                    ? "text-[#2563eb] font-semibold"
                    : "text-slate-400 bg-transparent hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon className={`mb-1 ${active ? "size-6 stroke-[2.5]" : "size-5 stroke-2"}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-1 h-1 w-8 rounded-full bg-[#2563eb]" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <DeviceConfigDialog
        open={isConfigDeviceOpen}
        onOpenChange={setIsConfigDeviceOpen}
        device={configDevice}
        pwaThemeStyle={pwaThemeStyle}
        onSuccess={(updatedDevice) => {
          setDevices((current) =>
            current.map((d) => (d.id === updatedDevice.id ? updatedDevice : d))
          )
          loadMainData() // Refresh full data in background
        }}
      />

      <NotificationPanel
        open={isNotificationOpen}
        onOpenChange={setIsNotificationOpen}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications(prev => {
            if (prev.some(n => !n.read)) {
              return prev.map(n => ({ ...n, read: true }))
            }
            return prev
          })
        }}
        onClearAll={() => setNotifications([])}
        pwaThemeStyle={pwaThemeStyle}
      />

      <AssistantBubble
        devices={devices}
        logs={logs}
        prediction={predictions[0]}
      />
    </main>
  )
}
