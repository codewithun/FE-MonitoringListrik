"use client"

import * as React from "react"
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser"
import {
  Activity,
  BarChart3,
  BatteryCharging,
  Bell,
  Camera,
  Home,
  KeyRound,
  LogOut,
  Plus,
  Smartphone,
  Upload,
  Zap,
} from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { logoutAction } from "@/app/actions/auth"
import {
  apiRequest,
  extractArray,
  getBoolean,
  getNumber,
  getString,
  getValue,
  isRecord,
} from "@/lib/api-client"
import type { SessionUser } from "@/lib/auth-constants"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type TabKey = "home" | "prediction"
type RelayStatus = "ON" | "OFF"

type House = {
  id: string
  name: string
}

type Device = {
  id: string
  deviceId: string
  name: string
  houseId: string
  houseName: string
  relayStatus: RelayStatus
}

type ElectricityLog = {
  id: string
  deviceId: string
  time: string
  voltage: number
  current: number
  power: number
  energy: number
  frequency: number
  powerFactor: number
}

type Prediction = {
  label: string
  cost: number
  energy: number
  houseId: string
  deviceId: string
}

const chartConfig = {
  power: {
    label: "Daya",
    color: "hsl(var(--chart-1))",
  },
  energy: {
    label: "Energi",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

function mapHouse(item: unknown, index: number): House {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], `house-${index}`),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
  }
}

function extractRelationArray(value: unknown) {
  const rows = extractArray(value)

  if (rows.length > 0) return rows
  if (isRecord(value)) return [value]

  return []
}

function mapUserHouse(item: unknown, index: number): House {
  if (!isRecord(item)) {
    return {
      id: "",
      name: "-",
    }
  }

  const directHouseId = getString(item, ["rumah_id", "id_rumah", "houseId"])
  const rawDirectHouseName = getValue(item, ["nama_rumah", "houseName", "rumah"])
  const directHouseName =
    typeof rawDirectHouseName === "string" || typeof rawDirectHouseName === "number"
      ? String(rawDirectHouseName)
      : ""

  if (directHouseId || directHouseName) {
    return {
      id: directHouseId || `house-${index}`,
      name: directHouseName || "-",
    }
  }

  return mapHouse(item, index)
}

function getHousesFromUserPayload(payload: unknown) {
  const source = isRecord(payload) && isRecord(payload.data) ? payload.data : payload

  if (!isRecord(source)) return []

  const nestedHouses = extractRelationArray(getValue(source, ["rumah", "houses"]))
    .map(mapUserHouse)
    .filter((house) => house.id || house.name !== "-")

  if (nestedHouses.length > 0) return nestedHouses

  const directHouseId = getString(source, ["rumah_id", "id_rumah", "houseId"])
  const rawDirectHouseName = getValue(source, ["nama_rumah", "houseName"])
  const directHouseName =
    typeof rawDirectHouseName === "string" || typeof rawDirectHouseName === "number"
      ? String(rawDirectHouseName)
      : ""

  if (!directHouseId && !directHouseName) return []

  return [
    {
      id: directHouseId || "house-0",
      name: directHouseName || "-",
    },
  ]
}

function idsMatch(first: string, second: string) {
  return first.trim() !== "" && String(first) === String(second)
}

function houseBelongsToUser(item: unknown, user: SessionUser) {
  const ownerIds = extractRelationArray(getValue(item, ["pemilik", "owners", "users"]))
    .map((owner) => getString(owner, ["id", "id_pengguna", "pengguna_id"]))

  return (
    idsMatch(getString(item, ["user_id", "id_user", "pengguna_id"]), user.id) ||
    ownerIds.some((ownerId) => idsMatch(ownerId, user.id))
  )
}

function mapDevice(item: unknown, index: number): Device {
  const relayOn = getBoolean(item, ["relay", "relay_status", "status_relay"], false)
  const nestedHouse = getValue(item, ["rumah", "house"])
  const rawHouseName = getValue(item, ["houseName", "nama_rumah", "rumah"])
  const houseName =
    typeof rawHouseName === "string" || typeof rawHouseName === "number"
      ? String(rawHouseName)
      : getString(nestedHouse, ["name", "nama", "nama_rumah"], "-")

  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id"], `device-${index}`),
    deviceId: getString(item, ["deviceId", "device_id", "kode_perangkat", "mac_address"], "-"),
    name: getString(item, ["name", "nama", "nama_perangkat", "nama_beban"], "-"),
    houseId:
      getString(item, ["houseId", "rumah_id", "id_rumah"]) ||
      getString(nestedHouse, ["id", "id_rumah", "rumah_id"], ""),
    houseName,
    relayStatus: relayOn ? "ON" : "OFF",
  }
}

function mapElectricityLog(item: unknown, index: number): ElectricityLog {
  const rawTime = getString(
    item,
    ["time", "waktu", "waktu_baca", "created_at", "timestamp"],
    String(index + 1)
  )

  return {
    id: getString(item, ["id"], `${rawTime}-${index}`),
    deviceId: getString(item, ["deviceId", "device_id"], "-"),
    time: formatTime(rawTime),
    voltage: getNumber(item, ["voltage", "tegangan"], 0),
    current: getNumber(item, ["current", "arus"], 0),
    power: getNumber(item, ["power", "daya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh"], 0),
    frequency: getNumber(item, ["frequency", "frekuensi"], 0),
    powerFactor: getNumber(item, ["powerFactor", "power_factor", "pf", "faktor_daya"], 0),
  }
}

function mapPrediction(item: unknown, index: number): Prediction {
  return {
    label: getString(item, ["label", "bulan", "periode"], `Prediksi ${index + 1}`),
    cost: getNumber(item, ["cost", "biaya", "prediksi_biaya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh", "prediksi_kwh"], 0),
    houseId: getString(item, ["houseId", "rumah_id", "id_rumah"], ""),
    deviceId: getString(item, ["deviceId", "device_id", "id_perangkat", "perangkat_id"], ""),
  }
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function isTabKey(value: string | null): value is TabKey {
  return value === "home" || value === "prediction"
}

function getTabFromUrl() {
  if (typeof window === "undefined") return "home"

  const tab = new URLSearchParams(window.location.search).get("tab")
  return isTabKey(tab) ? tab : "home"
}

export function UserPwaApp({ user }: { user: SessionUser }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const barcodeImageInputRef = React.useRef<HTMLInputElement>(null)
  const scanControlsRef = React.useRef<IScannerControls | null>(null)
  const [activeTab, setActiveTab] = React.useState<TabKey>(getTabFromUrl)
  const [houses, setHouses] = React.useState<House[]>([])
  const [devices, setDevices] = React.useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = React.useState("")
  const [logs, setLogs] = React.useState<ElectricityLog[]>([])
  const [predictions, setPredictions] = React.useState<Prediction[]>([])
  const [deviceCode, setDeviceCode] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [isBusy, setIsBusy] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = React.useState(false)
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanError, setScanError] = React.useState("")

  const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId)
  const latestLog = logs[0]
  const hasLinkedHouse = houses.length > 0
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
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data realtime terbaru."
      )
    }
  }, [selectedDeviceId])

  const loadPrediction = React.useCallback(async () => {
    if (!hasLinkedHouse) {
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
  }, [hasLinkedHouse, houses, selectedDeviceId])

  React.useEffect(() => {
    void Promise.resolve().then(loadMainData)
  }, [loadMainData])

  React.useEffect(() => {
    void Promise.resolve().then(loadPrediction)
  }, [loadPrediction])

  React.useEffect(() => {
    const syncTabFromHistory = () => {
      setActiveTab(getTabFromUrl())
    }

    window.addEventListener("popstate", syncTabFromHistory)

    return () => {
      window.removeEventListener("popstate", syncTabFromHistory)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadRealtime)
    const intervalId = window.setInterval(() => {
      void loadRealtime()
    }, 2500)

    return () => window.clearInterval(intervalId)
  }, [loadRealtime])

  React.useEffect(() => {
    if (isAddDeviceOpen) return

    stopBarcodeScan()
  }, [isAddDeviceOpen])

  React.useEffect(() => {
    return () => stopBarcodeScan()
  }, [])

  async function toggleRelay(nextChecked: boolean) {
    if (!selectedDevice) return

    const nextStatus: RelayStatus = nextChecked ? "ON" : "OFF"
    setDevices((current) =>
      current.map((device) =>
        device.deviceId === selectedDevice.deviceId
          ? { ...device, relayStatus: nextStatus }
          : device
      )
    )

    try {
      await apiRequest("/api/relay-control", {
        method: "POST",
        body: JSON.stringify({
          device_id: selectedDevice.deviceId,
          relay: nextChecked,
          status_relay: nextChecked,
        }),
      })
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal mengubah relay perangkat."
      )
      setDevices((current) =>
        current.map((device) =>
          device.deviceId === selectedDevice.deviceId
            ? { ...device, relayStatus: nextChecked ? "OFF" : "ON" }
            : device
        )
      )
    }
  }

  async function addDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!deviceCode.trim()) {
      setMessage("Masukkan ID alat terlebih dahulu.")
      return
    }

    if (!houses[0]?.id) {
      setMessage("Akun ini belum terhubung ke rumah. Hubungkan rumah dulu dari dashboard admin.")
      return
    }

    setIsBusy(true)
    try {
      await apiRequest("/api/perangkat", {
        method: "POST",
        body: JSON.stringify({
          device_id: deviceCode.trim(),
          nama_perangkat: `Perangkat ${deviceCode.trim()}`,
          rumah_id: houses[0]?.id,
          status: "Online",
        }),
      })
      setDeviceCode("")
      setMessage("Perangkat berhasil ditambahkan.")
      setIsAddDeviceOpen(false)
      await loadMainData()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal menambahkan perangkat."
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)

    try {
      await apiRequest(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ phone, nomor_telepon: phone }),
      })
      setMessage("Profil berhasil disimpan.")
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan profil. Pastikan backend sudah punya field nomor telepon."
      )
    } finally {
      setIsBusy(false)
    }
  }

  function stopBarcodeScan() {
    scanControlsRef.current?.stop()
    scanControlsRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  async function startBarcodeScan() {
    setScanError("")

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera tidak tersedia di browser ini.")
      return
    }

    const video = videoRef.current

    if (!video) return

    try {
      stopBarcodeScan()
      setIsScanning(true)

      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 250,
      })

      scanControlsRef.current = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        video,
        (result) => {
          const rawValue = result?.getText().trim()

          if (!rawValue) return

          setDeviceCode(rawValue)
          setMessage(`ID perangkat terbaca: ${rawValue}`)
          stopBarcodeScan()
        }
      )
    } catch {
      setScanError("Tidak bisa membuka kamera. Cek izin kamera untuk PWA ini.")
      stopBarcodeScan()
    }
  }

  async function scanBarcodeImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    const imageUrl = window.URL.createObjectURL(file)

    try {
      setScanError("")
      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeFromImageUrl(imageUrl)
      const rawValue = result.getText().trim()

      if (!rawValue) {
        setScanError("Barcode tidak terbaca dari foto. Coba foto yang lebih jelas.")
        return
      }

      setDeviceCode(rawValue)
      setMessage(`ID perangkat terbaca: ${rawValue}`)
    } catch {
      setScanError("Barcode tidak terbaca dari foto. Coba foto yang lebih jelas atau ketik ID alat.")
    } finally {
      window.URL.revokeObjectURL(imageUrl)
      event.target.value = ""
    }
  }

  const metrics = [
    { label: "Tegangan", value: `${latestLog?.voltage ?? 0} V`, icon: Zap },
    { label: "Arus", value: `${latestLog?.current ?? 0} A`, icon: Activity },
    { label: "Energi", value: `${latestLog?.energy ?? 0} kWh`, icon: BatteryCharging },
    { label: "Faktor", value: `${latestLog?.powerFactor ?? 0}`, icon: BarChart3 },
  ]

  const prediction = predictions[0]

  return (
    <main className="min-h-svh bg-background text-foreground">
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
          <section className="space-y-4 p-4">
            <Card>
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      Kontrol Perangkat
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedDevice?.houseName || houses[0]?.name || "Rumah belum dipilih"}
                    </p>
                  </div>
                  <Switch
                    checked={selectedDevice?.relayStatus === "ON"}
                    disabled={!selectedDevice}
                    onCheckedChange={toggleRelay}
                  />
                </div>
                <select
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {devices.map((device) => (
                    <option key={device.id} value={device.deviceId}>
                      {device.name} - {device.deviceId}
                    </option>
                  ))}
                  {devices.length === 0 ? (
                    <option value="">Belum ada perangkat</option>
                  ) : null}
                </select>
              </CardHeader>
            </Card>

            {!hasLinkedHouse ? (
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-medium">Akun belum tersambung ke rumah.</p>
                  <p className="text-muted-foreground">
                    Setelah admin menghubungkan akun ini ke rumah, data perangkat,
                    realtime, dan prediksi akan muncul di sini.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => {
                const Icon = metric.icon

                return (
                  <Card key={metric.label}>
                    <CardContent className="space-y-2 p-4">
                      <Icon className="size-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-lg font-semibold">{metric.value}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grafik Realtime</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-56 w-full"
                  initialDimension={{ width: 360, height: 220 }}
                >
                  <LineChart data={logs.slice().reverse()}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="time" tickMargin={8} />
                    <YAxis width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="power"
                      stroke="var(--color-power)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Riwayat Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{log.time}</p>
                      <p className="text-muted-foreground">
                        {log.voltage} V / {log.current} A / {log.frequency} Hz
                      </p>
                    </div>
                    <p className="font-semibold">{log.power} W</p>
                  </div>
                ))}
                {logs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada data listrik terbaru.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {activeTab === "prediction" ? (
          <section className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prediksi Biaya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">
                    {prediction?.label || "Bulan ini / bulan depan"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {formatCurrency(prediction?.cost ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estimasi energi {prediction?.energy ?? 0} kWh.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Data prediksi diambil dari endpoint machine learning LSTM
                  `/api/prediksi-bulanan`.
                </p>
              </CardContent>
            </Card>
          </section>
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
                  item.key === "add"
                    ? setIsAddDeviceOpen(true)
                    : switchTab(item.key)
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

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profil</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Avatar size="lg">
                <AvatarFallback>{avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.username}</p>
                <Badge variant={user.role === "user" ? "default" : "secondary"}>
                  PWA
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={user.username} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
              />
            </div>
            <div className="space-y-2">
              <Label>Ubah Sandi</Label>
              <Input
                type="password"
                placeholder="Password baru"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isBusy}>
              <KeyRound />
              Simpan Profil
            </Button>
          </form>
          <form action={logoutAction}>
            <Button variant="outline" className="w-full">
              <LogOut />
              Logout
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pesan</DialogTitle>
            <DialogDescription>Notifikasi akun dan perangkat.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada pesan baru.
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Perangkat</DialogTitle>
            <DialogDescription>
              Scan barcode ID perangkat atau masukkan ID alat secara manual.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addDevice} className="space-y-4">
            <div className="space-y-2">
              <Label>ID Alat</Label>
              <div className="flex gap-2">
                <Input
                  value={deviceCode}
                  onChange={(event) => setDeviceCode(event.target.value)}
                  placeholder="Scan barcode atau ketik ID alat"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Scan barcode"
                  onClick={isScanning ? stopBarcodeScan : startBarcodeScan}
                >
                  <Camera />
                </Button>
              </div>
              <input
                ref={barcodeImageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={scanBarcodeImage}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => barcodeImageInputRef.current?.click()}
              >
                <Upload />
                Scan dari Foto
              </Button>
            </div>
            <div
              className={`overflow-hidden rounded-md border bg-muted ${
                isScanning ? "block" : "hidden"
              }`}
            >
              <video
                ref={videoRef}
                className="aspect-video w-full scale-x-100 object-cover"
                muted
                playsInline
              />
            </div>
            {scanError ? (
              <p className="text-sm text-destructive">{scanError}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isBusy}>
              <Plus />
              Tambah ke Rumah Saya
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
