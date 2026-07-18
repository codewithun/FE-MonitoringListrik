"use client"

import * as React from "react"
import { Bell, Home, Moon, Plus, Smartphone, Sun } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { AssistantBubble } from "./pwa/assistant-bubble"
import { AddDialog } from "./pwa/add-dialog"
import { ProfileDialog } from "./pwa/profile-dialog"
import { DeviceConfigDialog } from "./pwa/device-config-dialog"

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

  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = React.useState(false)
  const [isMissingHouseAlertOpen, setIsMissingHouseAlertOpen] = React.useState(false)
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
      setIsMissingHouseAlertOpen((current) =>
        current ? current : nextHouses.length === 0
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

  function openAddFlow() {
    setAddMode("device")
    setIsAddDeviceOpen(true)
  }

  return (
    <main
      className="min-h-svh bg-background text-foreground"
      style={pwaThemeStyle}
    >
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col pb-24">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">WattWise</p>
              <h1 className="text-xl font-semibold">Halo, {user.username}</h1>
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
                <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
              </Button>
              <button
                type="button"
                aria-label="Buka profil"
                onClick={() => setIsProfileOpen(true)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar size="lg">
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
              </button>
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
          <PredictionTab prediction={predictions[0]} />
        ) : null}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[100] border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {[
            { key: "home" as const, label: "Home", icon: Home },
            { key: "add" as const, label: "Tambah", icon: Plus },
            { key: "prediction" as const, label: "Biaya", icon: Smartphone },
          ].map((item) => {
            const Icon = item.icon
            const active = item.key !== "add" && activeTab === item.key

            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  item.key === "add" ? openAddFlow() : switchTab(item.key)
                }
                className={`flex h-12 flex-col items-center justify-center rounded-md text-xs ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : item.key === "add"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      <ProfileDialog
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        user={user}
        houses={houses}
        onSuccess={loadMainData}
        setMessage={setMessage}
        pwaThemeStyle={pwaThemeStyle}
        onAddHouseClick={() => {
          setAddMode("house")
          setIsAddDeviceOpen(true)
        }}
      />

      <AddDialog
        isOpen={isAddDeviceOpen}
        onOpenChange={setIsAddDeviceOpen}
        addMode={addMode}
        setAddMode={setAddMode}
        houses={houses}
        user={user}
        onSuccess={loadMainData}
        setMessage={setMessage}
        isMissingHouseAlertOpen={isMissingHouseAlertOpen}
        setIsMissingHouseAlertOpen={setIsMissingHouseAlertOpen}
        pwaThemeStyle={pwaThemeStyle}
      />

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

      <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <DialogContent className="max-w-md" style={pwaThemeStyle}>
          <DialogHeader>
            <DialogTitle>Pesan</DialogTitle>
            <DialogDescription>Notifikasi akun dan perangkat.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada pesan baru.
          </div>
        </DialogContent>
      </Dialog>

      <AssistantBubble
        devices={devices}
        logs={logs}
        prediction={predictions[0]}
      />
    </main>
  )
}
