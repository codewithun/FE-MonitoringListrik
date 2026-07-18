"use client"

import * as React from "react"
import { toast } from "sonner"

import { SectionShell } from "@/components/section-shell"
import {
  apiRequest,
  extractArray,
  getBoolean,
  getNumber,
  getString,
} from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Cpu,
  Gauge,
  MoreHorizontal,
  PlugZap,
  Search,
  ToggleLeft,
  Zap,
  Wifi,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import QRCode from "react-qr-code"

type DeviceStatus = "Online" | "Offline"
type RelayStatus = "ON" | "OFF"

type DeviceRow = {
  id: string
  deviceCode: string
  houseId: string
  name: string
  houseName: string
  loadName: string
  status: DeviceStatus
  powerW: number
  relayStatus: RelayStatus
  lastUpdate: string
  note?: string
}

type DeviceForm = {
  deviceCode: string
  houseId: string
  name: string
  houseName: string
  loadName: string
  status: DeviceStatus
  powerW: string
  relayStatus: RelayStatus
  note: string
}

type HouseOption = {
  id: string
  name: string
}

type ElectricityLog = {
  deviceId: string
  time: string
  voltage: number
  current: number
  power: number
  energy: number
  frequency: number
  powerFactor: number
}

type BarcodePreview = {
  deviceCode: string
  name: string
  houseName: string
}

const emptyForm: DeviceForm = {
  deviceCode: "",
  houseId: "",
  name: "",
  houseName: "",
  loadName: "",
  status: "Online",
  powerW: "0",
  relayStatus: "OFF",
  note: "",
}

function getDeviceBadgeVariant(status: DeviceStatus) {
  switch (status) {
    case "Online":
      return "default"
    case "Offline":
      return "destructive"
    default:
      return "secondary"
  }
}

function getRelayBadgeVariant(status: RelayStatus) {
  return status === "ON" ? "default" : "secondary"
}

function formatPower(value: number) {
  return `${value.toLocaleString("id-ID")} W`
}

function normalizeDeviceStatus(status: string): DeviceStatus {
  const normalized = status.toLowerCase()

  if (normalized.includes("offline") || normalized.includes("mati")) {
    return "Offline"
  }

  return "Online"
}

function mapDeviceRow(item: unknown, index: number): DeviceRow {
  const relayOn = getBoolean(
    item,
    ["relay", "relayStatus", "statusRelay", "relay_status", "status_relay", "is_relay", "isRelay"],
    false
  )

  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id"], `device-${index}`),
    deviceCode: getString(item, ["deviceCode", "device_id", "kode_perangkat", "mac_address"], "-"),
    houseId: getString(item, ["houseId", "rumah_id", "id_rumah"], ""),
    name: getString(item, ["name", "nama", "nama_perangkat"], "-"),
    houseName: getString(item, ["houseName", "nama_rumah", "rumah"], "-"),
    loadName: getString(item, ["loadName", "nama_beban", "beban"], "-"),
    status: normalizeDeviceStatus(getString(item, ["status", "status_perangkat"], "Online")),
    powerW: getNumber(item, ["powerW", "power", "daya", "daya_watt"], 0),
    relayStatus: relayOn ? "ON" : "OFF",
    lastUpdate: getString(item, ["lastUpdate", "updated_at", "waktu"], "-"),
    note: getString(item, ["note", "catatan", "keterangan"]),
  }
}

function mapHouseOption(item: unknown, index: number): HouseOption {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], `house-${index}`),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
  }
}

function mapElectricityLog(item: unknown, index: number): ElectricityLog {
  return {
    deviceId: getString(item, ["deviceId", "device_id", "kode_perangkat", "mac_address"], ""),
    time: getString(item, ["time", "waktu", "waktu_baca", "created_at"], "-"),
    voltage: getNumber(item, ["voltage", "tegangan"], 0),
    current: getNumber(item, ["current", "arus"], 0),
    power: getNumber(item, ["power", "daya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh"], 0),
    frequency: getNumber(item, ["frequency", "frekuensi"], 0),
    powerFactor: getNumber(item, ["powerFactor", "power_factor", "faktor_daya", "pf"], 0),
  }
}

function getReadingTimeValue(reading: ElectricityLog) {
  const parsed = new Date(reading.time).getTime()

  return Number.isNaN(parsed) ? 0 : parsed
}

function mergeLatestReadings(
  devices: DeviceRow[],
  readings: ElectricityLog[]
) {
  const latestByDeviceId = new Map<string, ElectricityLog>()

  for (const reading of readings) {
    if (!reading.deviceId) continue

    const current = latestByDeviceId.get(reading.deviceId)

    if (!current || getReadingTimeValue(reading) >= getReadingTimeValue(current)) {
      latestByDeviceId.set(reading.deviceId, reading)
    }
  }

  return devices.map((device) => {
    const latestReading = latestByDeviceId.get(device.deviceCode)

    if (!latestReading) return device

    return {
      ...device,
      powerW: device.relayStatus === "OFF" ? 0 : latestReading.power,
      lastUpdate: latestReading.time,
    }
  })
}

const detailChartConfig = {
  power: {
    label: "Daya",
    color: "var(--chart-1)",
  },
  voltage: {
    label: "Tegangan",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export default function Page() {
  const [deviceRows, setDeviceRows] = React.useState<DeviceRow[]>([])
  const [houseOptions, setHouseOptions] = React.useState<HouseOption[]>([])
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detailDevice, setDetailDevice] = React.useState<DeviceRow | null>(null)
  const qrCodeWrapRef = React.useRef<HTMLDivElement>(null)
  const [barcodePreview, setBarcodePreview] = React.useState<BarcodePreview | null>(null)
  const [detailRows, setDetailRows] = React.useState<ElectricityLog[]>([])
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [detailError, setDetailError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [houseError, setHouseError] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] =
    React.useState<DeviceStatus | "all">("all")
  const [relayFilter, setRelayFilter] =
    React.useState<RelayStatus | "all">("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<DeviceForm>(emptyForm)

  const pageSize = 5

  const loadDevices = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const [devicePayload, historyPayload] = await Promise.all([
        apiRequest<unknown>("/api/perangkat"),
        apiRequest<unknown>("/api/data-listrik/history?limit=200").catch(
          () => null
        ),
      ])
      const nextDevices = extractArray(devicePayload).map(mapDeviceRow)
      const globalReadings = extractArray(historyPayload).map(mapElectricityLog)
      const globalDeviceIds = new Set(
        globalReadings.map((reading) => reading.deviceId).filter(Boolean)
      )
      const missingDevices = nextDevices.filter(
        (device) =>
          device.deviceCode &&
          device.deviceCode !== "-" &&
          !globalDeviceIds.has(device.deviceCode)
      )
      const perDeviceReadings = await Promise.all(
        missingDevices.map((device) =>
          apiRequest<unknown>(
            `/api/data-listrik/history?deviceId=${encodeURIComponent(
              device.deviceCode
            )}&limit=1`
          )
            .then((payload) => extractArray(payload).map(mapElectricityLog))
            .catch(() => [])
        )
      )
      const latestReadings = [
        ...globalReadings,
        ...perDeviceReadings.flat(),
      ]

      setDeviceRows(mergeLatestReadings(nextDevices, latestReadings))
      setCurrentPage(1)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data perangkat."
      )
      setDeviceRows([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadDevices)
    
    // Cleanup function
    return () => {}
  }, [])

  const loadHouseOptions = React.useCallback(async () => {
    setHouseError("")

    try {
      const payload = await apiRequest<unknown>("/api/rumah")
      setHouseOptions(extractArray(payload).map(mapHouseOption))
    } catch (error) {
      setHouseError(
        error instanceof Error ? error.message : "Gagal mengambil data rumah."
      )
      setHouseOptions([])
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadHouseOptions)
  }, [loadHouseOptions])

  async function openDeviceDetail(device: DeviceRow) {
    setDetailDevice(device)
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailRows([])

    try {
      const payload = await apiRequest<unknown>(
        `/api/data-listrik/history?deviceId=${encodeURIComponent(
          device.deviceCode
        )}&limit=30`
      )
      setDetailRows(extractArray(payload).map(mapElectricityLog).reverse())
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil detail realtime perangkat."
      )
    } finally {
      setDetailLoading(false)
    }
  }

  const totalDevices = deviceRows.length
  const onlineCount = deviceRows.filter(
    (device) => device.status === "Online"
  ).length
  const relayOnCount = deviceRows.filter(
    (device) => device.relayStatus === "ON"
  ).length
  const offlineCount = deviceRows.filter(
    (device) => device.status === "Offline"
  ).length

  const filteredDeviceRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return deviceRows.filter((device) => {
      const matchesQuery =
        !query ||
        [
          device.deviceCode,
          device.name,
          device.houseName,
          device.loadName,
          device.status,
          device.relayStatus,
          device.note ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter

      const matchesRelay =
        relayFilter === "all" || device.relayStatus === relayFilter

      return matchesQuery && matchesStatus && matchesRelay
    })
  }, [deviceRows, searchQuery, statusFilter, relayFilter])

  const totalPages = Math.max(1, Math.ceil(filteredDeviceRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedDeviceRows = React.useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredDeviceRows.slice(startIndex, startIndex + pageSize)
  }, [filteredDeviceRows, safeCurrentPage])

  const deviceStats = [
    {
      label: "Total Perangkat",
      value: totalDevices,
      note: "Jumlah perangkat terdaftar",
      icon: Cpu,
    },
    {
      label: "Online",
      value: onlineCount,
      note: "Perangkat aktif mengirim data",
      icon: Wifi,
    },
    {
      label: "Relay ON",
      value: relayOnCount,
      note: "Beban sedang menyala",
      icon: ToggleLeft,
    },
    {
      label: "Offline",
      value: offlineCount,
      note: "Perangkat tidak aktif mengirim data",
      icon: PlugZap,
    },
  ]

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function handleAddClick() {
    resetForm()
    setOpen(true)
  }

  function handleEdit(device: DeviceRow) {
    setEditingId(device.id)
    setForm({
      deviceCode: device.deviceCode,
      houseId: device.houseId,
      name: device.name,
      houseName: device.houseName,
      loadName: device.loadName,
      status: device.status,
      powerW: String(device.powerW),
      relayStatus: device.relayStatus,
      note: device.note ?? "",
    })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus perangkat ini?"
    )

    if (!confirmDelete) return

    try {
      await apiRequest(`/api/perangkat/${id}`, {
        method: "DELETE",
      })
      await loadDevices()
      toast.success("Berhasil menghapus perangkat.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus perangkat."
      )
    }
  }

  async function handleToggleRelay(device: DeviceRow, checked: boolean) {
    const nextStatus: RelayStatus = checked ? "ON" : "OFF"

    setDeviceRows((current) =>
      current.map((item) =>
        item.id === device.id
          ? {
              ...item,
              relayStatus: nextStatus,
              lastUpdate: "Baru saja",
              powerW: checked ? Math.max(item.powerW, 80) : 0,
            }
          : item
      )
    )

    try {
      await apiRequest("/api/relay-control", {
        method: "POST",
        body: JSON.stringify({
          id: device.id,
          deviceId: device.deviceCode,
          device_id: device.deviceCode,
          relay: checked,
          status: nextStatus,
          relay_status: nextStatus,
        }),
      })
      await loadDevices()
      toast.success(`Relay berhasil diubah menjadi ${nextStatus}.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengubah relay."
      toast.error(errorMessage)
      await loadDevices()
    }
  }

  async function downloadBarcodePreview() {
    const wrapper = qrCodeWrapRef.current
    const svgElement = wrapper?.querySelector("svg")

    if (!svgElement || !barcodePreview) return

    const serializer = new XMLSerializer()
    const svgText = serializer.serializeToString(svgElement)
    const normalizedSvg = svgText.includes("xmlns")
      ? svgText
      : svgText.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')

    const svgBlob = new Blob([normalizedSvg], {
      type: "image/svg+xml;charset=utf-8",
    })
    const svgUrl = URL.createObjectURL(svgBlob)
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement("canvas")
      const size = 1024
      const footerHeight = 180
      canvas.width = size
      canvas.height = size + footerHeight

      const context = canvas.getContext("2d")

      if (!context) {
        URL.revokeObjectURL(svgUrl)
        return
      }

      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 128, 80, size - 256, size - 256)

      context.fillStyle = "#111827"
      context.textAlign = "center"
      context.textBaseline = "top"

      context.font = "bold 44px Arial"
      context.fillText("ID Alat", canvas.width / 2, size + 20)

      context.font = "bold 34px Arial"
      context.fillText(barcodePreview.deviceCode, canvas.width / 2, size + 78)

      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(svgUrl)
          return
        }

        const downloadUrl = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = downloadUrl
        anchor.download = `qr-${barcodePreview.deviceCode}.png`
        anchor.click()
        URL.revokeObjectURL(downloadUrl)
        URL.revokeObjectURL(svgUrl)
      }, "image/png")
    }

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl)
    }

    image.src = svgUrl
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const codeAlreadyUsed = deviceRows.some(
      (device) =>
        device.deviceCode === form.deviceCode.trim() && device.id !== editingId
    )

    if (codeAlreadyUsed) {
      toast.warning("Device ID sudah digunakan oleh perangkat lain.")
      return
    }

    const nextDevice: DeviceRow = {
      id: editingId ?? "",
      deviceCode: form.deviceCode.trim(),
      houseId: form.houseId,
      name: form.name.trim(),
      houseName:
        houseOptions.find((house) => house.id === form.houseId)?.name ??
        form.houseName.trim(),
      loadName: form.loadName.trim(),
      status: form.status,
      powerW: Number(form.powerW || 0),
      relayStatus: form.relayStatus,
      lastUpdate: "Baru saja",
      note: form.note.trim(),
    }

    if (!editingId) {
      try {
        await apiRequest("/api/perangkat", {
          method: "POST",
          body: JSON.stringify({
            device_id: nextDevice.deviceCode,
            kode_perangkat: nextDevice.deviceCode,
            rumah_id: nextDevice.houseId || null,
            nama_perangkat: nextDevice.name,
            nama_beban: nextDevice.loadName,
            nama: nextDevice.name,
            nama_rumah: nextDevice.houseName,
            status: nextDevice.status,
            daya: nextDevice.powerW,
            relay_status: nextDevice.relayStatus,
            catatan: nextDevice.note,
          }),
        })
        await loadDevices()
        setBarcodePreview({
          deviceCode: nextDevice.deviceCode,
          name: nextDevice.name || `Perangkat ${nextDevice.deviceCode}`,
          houseName: nextDevice.houseName || "-",
        })
        resetForm()
        setOpen(false)
        toast.success("Berhasil menambahkan perangkat.")
        return
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Gagal menyimpan perangkat."
        )
        return
      }
    }

    try {
      await apiRequest(`/api/perangkat/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          nama_perangkat: nextDevice.name,
          nama_beban: nextDevice.loadName,
          rumah_id: nextDevice.houseId || null,
          status_relay: nextDevice.relayStatus === "ON",
          status_online: nextDevice.status === "Online",
          catatan: nextDevice.note,
        }),
      })
      await loadDevices()
      resetForm()
      setOpen(false)
      toast.success("Berhasil memperbarui perangkat.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui perangkat."
      )
    }
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Manajemen Perangkat
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola perangkat ESP32, PZEM, dan relay yang terhubung ke rumah
              pengguna.
            </p>
          </div>

          <Button className="w-full md:w-auto" onClick={handleAddClick}>
            Tambah Perangkat
          </Button>
        </div>

        {/* Drawer Form */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <form onSubmit={handleSubmit}>
              <DrawerHeader>
                <DrawerTitle>
                  {editingId ? "Edit Perangkat" : "Tambah Perangkat"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingId
                    ? "Perbarui data perangkat yang sudah terdaftar."
                    : "Tambahkan perangkat baru dan hubungkan dengan rumah pengguna."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid gap-4 px-4 pb-4 md:grid-cols-2 md:px-6">
                <div className="grid gap-2">
                  <Label htmlFor="device-code">Device ID</Label>
                  <Input
                    id="device-code"
                    value={form.deviceCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deviceCode: event.target.value,
                      }))
                    }
                    placeholder="Contoh: 9454C5A93644"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Bisa menggunakan MAC Address ESP32.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="device-name">Nama Perangkat</Label>
                  <Input
                    id="device-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Contoh: ESP32 Ruang Tamu"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Rumah</Label>
                  <Select
                    value={form.houseId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        houseId: value,
                        houseName:
                          houseOptions.find((house) => house.id === value)
                            ?.name ?? "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rumah" />
                    </SelectTrigger>
                    <SelectContent>
                      {houseOptions.map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {houseError ? (
                    <p className="text-xs text-destructive">{houseError}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="load-name">Nama Beban</Label>
                  <Input
                    id="load-name"
                    value={form.loadName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        loadName: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Lampu Ruang Tamu"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Status Perangkat</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        status: value as DeviceStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status perangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="device-power">Daya Saat Ini</Label>
                  <Input
                    id="device-power"
                    type="number"
                    min={0}
                    value={form.powerW}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        powerW: event.target.value,
                      }))
                    }
                    placeholder="Contoh: 240"
                    required
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-2">
                  <div className="space-y-1">
                    <Label>Status Relay</Label>
                    <p className="text-sm text-muted-foreground">
                      Relay digunakan untuk ON/OFF beban pada perangkat ini.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getRelayBadgeVariant(form.relayStatus)}>
                      {form.relayStatus}
                    </Badge>
                    <Switch
                      checked={form.relayStatus === "ON"}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          relayStatus: checked ? "ON" : "OFF",
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="device-note">Catatan</Label>
                  <Textarea
                    id="device-note"
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Catatan tambahan perangkat"
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button type="submit">
                  {editingId ? "Simpan Perubahan" : "Simpan Perangkat"}
                </Button>

                <DrawerClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>

        {/* Statistics */}
        {errorMessage && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-sm text-destructive">
              {errorMessage}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {deviceStats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardDescription>{stat.label}</CardDescription>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {stat.note}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{detailDevice?.name ?? "Detail Perangkat"}</DialogTitle>
              <DialogDescription>
                {detailDevice
                  ? `${detailDevice.deviceCode} - ${detailDevice.houseName || "Tanpa rumah"}`
                  : "Data realtime perangkat"}
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Mengambil data realtime perangkat...
              </p>
            ) : detailError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {detailError}
              </p>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      label: "Tegangan",
                      value: `${detailRows.at(-1)?.voltage ?? 0} V`,
                      icon: Zap,
                    },
                    {
                      label: "Energi",
                      value: `${detailRows.at(-1)?.energy ?? 0} kWh`,
                      icon: Gauge,
                    },
                    {
                      label: "Arus",
                      value: `${detailRows.at(-1)?.current ?? 0} A`,
                      icon: Gauge,
                    },
                    {
                      label: "Frekuensi",
                      value: `${detailRows.at(-1)?.frequency ?? 0} Hz`,
                      icon: Wifi,
                    },
                    {
                      label: "Daya",
                      value: `${detailRows.at(-1)?.power ?? 0} W`,
                      icon: PlugZap,
                    },
                    {
                      label: "Faktor Daya",
                      value: String(detailRows.at(-1)?.powerFactor ?? 0),
                      icon: ToggleLeft,
                    },
                  ].map((metric) => {
                    const Icon = metric.icon

                    return (
                      <Card key={metric.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardDescription>{metric.label}</CardDescription>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-xl">{metric.value}</CardTitle>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Grafik Realtime</CardTitle>
                    <CardDescription>
                      Tren daya dan tegangan dari data terbaru perangkat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {detailRows.length > 0 ? (
                      <ChartContainer
                        config={detailChartConfig}
                        className="h-72 w-full"
                      >
                        <AreaChart
                          accessibilityLayer
                          data={detailRows}
                          margin={{
                            left: 12,
                            right: 12,
                          }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                          />
                          <YAxis />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                          />
                          <Area
                            type="monotone"
                            dataKey="power"
                            fill="var(--color-power)"
                            fillOpacity={0.35}
                            stroke="var(--color-power)"
                          />
                          <Area
                            type="monotone"
                            dataKey="voltage"
                            fill="var(--color-voltage)"
                            fillOpacity={0.2}
                            stroke="var(--color-voltage)"
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada data realtime untuk perangkat ini.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={barcodePreview !== null}
          onOpenChange={(open) => {
            if (!open) setBarcodePreview(null)
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code Perangkat</DialogTitle>
              <DialogDescription>
                Simpan QR code ini untuk ditempel pada perangkat. Saat dipindai di
                menu user, ID alat akan terisi otomatis.
              </DialogDescription>
            </DialogHeader>

            {barcodePreview ? (
              <div className="space-y-4">
                <div ref={qrCodeWrapRef} className="space-y-3 rounded-lg border bg-white p-6">
                  <div className="flex items-center justify-center">
                    <QRCode
                      value={barcodePreview.deviceCode}
                      size={192}
                      fgColor="#111827"
                      bgColor="#ffffff"
                    />
                  </div>
                  <div className="text-center text-sm">
                    <div className="text-muted-foreground">ID Alat</div>
                    <div className="font-mono text-base font-semibold tracking-wide">
                      {barcodePreview.deviceCode}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Nama</span>
                    <span className="font-medium">{barcodePreview.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Rumah</span>
                    <span className="font-medium">{barcodePreview.houseName}</span>
                  </div>
                </div>

                <Button type="button" className="w-full" onClick={downloadBarcodePreview}>
                  Unduh Gambar QR
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Daftar Perangkat</CardTitle>
            <CardDescription>
              Data perangkat yang terhubung dengan rumah pengguna.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Filter */}
            <div className="grid gap-4 pb-6 md:grid-cols-[1fr_180px_180px]">
              <div className="grid gap-2">
                <Label htmlFor="device-search">Cari Perangkat</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="device-search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Cari device ID, nama perangkat, rumah, atau beban"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as DeviceStatus | "all")
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Relay</Label>
                <Select
                  value={relayFilter}
                  onValueChange={(value) => {
                    setRelayFilter(value as RelayStatus | "all")
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter relay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Relay</SelectItem>
                    <SelectItem value="ON">ON</SelectItem>
                    <SelectItem value="OFF">OFF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Nama Perangkat</TableHead>
                    <TableHead>Rumah</TableHead>
                    <TableHead>Nama Beban</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Daya</TableHead>
                    <TableHead>Relay</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedDeviceRows.length > 0 ? (
                    paginatedDeviceRows.map((device) => (
                      <TableRow
                        key={device.id}
                        className="cursor-pointer"
                        onClick={() => openDeviceDetail(device)}
                      >
                        <TableCell className="font-mono text-sm">
                          {device.deviceCode}
                        </TableCell>

                        <TableCell className="font-medium">
                          {device.name}
                        </TableCell>

                        <TableCell>{device.houseName}</TableCell>

                        <TableCell>{device.loadName}</TableCell>

                        <TableCell>
                          <Badge variant={getDeviceBadgeVariant(device.status)}>
                            {device.status}
                          </Badge>
                        </TableCell>

                        <TableCell>{formatPower(device.powerW)}</TableCell>

                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={device.relayStatus === "ON"}
                              disabled={device.status === "Offline"}
                              onCheckedChange={(checked) =>
                                handleToggleRelay(device, checked)
                              }
                            />
                            <Badge
                              variant={getRelayBadgeVariant(
                                device.relayStatus
                              )}
                            >
                              {device.relayStatus}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {device.lastUpdate}
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Aksi</span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openDeviceDetail(device)}
                              >
                                Detail
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  setBarcodePreview({
                                    deviceCode: device.deviceCode,
                                    name: device.name,
                                    houseName: device.houseName,
                                  })
                                }
                                disabled={!device.deviceCode || device.deviceCode === "-"}
                              >
                                QR Code
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => handleEdit(device)}>
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(device.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {isLoading
                          ? "Mengambil data perangkat dari server..."
                          : "Tidak ada data perangkat yang sesuai dengan pencarian."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {paginatedDeviceRows.length} dari{" "}
                {filteredDeviceRows.length} data perangkat.
              </p>

              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage((page) => Math.max(page - 1, 1))
                      }}
                      className={
                        safeCurrentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safeCurrentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          setCurrentPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }}
                      className={
                        safeCurrentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
