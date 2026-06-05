"use client"

import * as React from "react"

import { SectionShell } from "@/components/section-shell"
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
  MoreHorizontal,
  PlugZap,
  Search,
  ToggleLeft,
  Wifi,
} from "lucide-react"

type DeviceStatus = "Online" | "Offline" | "Perlu Cek"
type RelayStatus = "ON" | "OFF"

type DeviceRow = {
  id: string
  deviceCode: string
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
  name: string
  houseName: string
  loadName: string
  status: DeviceStatus
  powerW: string
  relayStatus: RelayStatus
  note: string
}

const initialDevices: DeviceRow[] = [
  {
    id: "device-1",
    deviceCode: "9454C5A93644",
    name: "ESP32 Ruang Tamu",
    houseName: "Rumah Melati 12",
    loadName: "Lampu Ruang Tamu",
    status: "Online",
    powerW: 240,
    relayStatus: "ON",
    lastUpdate: "1 menit lalu",
    note: "Perangkat utama untuk monitoring ruang tamu.",
  },
  {
    id: "device-2",
    deviceCode: "A12B45C78D90",
    name: "ESP32 Kamar Utama",
    houseName: "Rumah Kenanga 07",
    loadName: "Kipas Angin",
    status: "Online",
    powerW: 120,
    relayStatus: "OFF",
    lastUpdate: "5 menit lalu",
    note: "Relay sedang dimatikan.",
  },
  {
    id: "device-3",
    deviceCode: "BC34D56E7890",
    name: "ESP32 Dapur",
    houseName: "Rumah Anggrek 19",
    loadName: "Lampu Dapur",
    status: "Offline",
    powerW: 0,
    relayStatus: "OFF",
    lastUpdate: "43 menit lalu",
    note: "Perangkat tidak mengirim data.",
  },
  {
    id: "device-4",
    deviceCode: "D90E12F34A56",
    name: "ESP32 Garasi",
    houseName: "Rumah Cempaka 03",
    loadName: "Lampu Garasi",
    status: "Perlu Cek",
    powerW: 80,
    relayStatus: "ON",
    lastUpdate: "12 menit lalu",
    note: "Perlu pengecekan koneksi sensor.",
  },
]

const emptyForm: DeviceForm = {
  deviceCode: "",
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
    case "Perlu Cek":
      return "outline"
    default:
      return "secondary"
  }
}

function getRelayBadgeVariant(status: RelayStatus) {
  return status === "ON" ? "default" : "secondary"
}

function generateId() {
  return `device-${Date.now()}`
}

function formatPower(value: number) {
  return `${value.toLocaleString("id-ID")} W`
}

export default function Page() {
  const [deviceRows, setDeviceRows] = React.useState<DeviceRow[]>(initialDevices)
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

  const totalDevices = deviceRows.length
  const onlineCount = deviceRows.filter(
    (device) => device.status === "Online"
  ).length
  const relayOnCount = deviceRows.filter(
    (device) => device.relayStatus === "ON"
  ).length
  const attentionCount = deviceRows.filter(
    (device) => device.status === "Offline" || device.status === "Perlu Cek"
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
      label: "Perlu Cek",
      value: attentionCount,
      note: "Offline atau butuh pemeriksaan",
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

  function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus perangkat ini?"
    )

    if (!confirmDelete) return

    setDeviceRows((current) => current.filter((device) => device.id !== id))
    setCurrentPage(1)
  }

  function handleToggleRelay(id: string, checked: boolean) {
    setDeviceRows((current) =>
      current.map((device) =>
        device.id === id
          ? {
              ...device,
              relayStatus: checked ? "ON" : "OFF",
              lastUpdate: "Baru saja",
              powerW: checked ? Math.max(device.powerW, 80) : 0,
            }
          : device
      )
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const codeAlreadyUsed = deviceRows.some(
      (device) =>
        device.deviceCode === form.deviceCode.trim() && device.id !== editingId
    )

    if (codeAlreadyUsed) {
      window.alert("Device ID sudah digunakan oleh perangkat lain.")
      return
    }

    const existingDevice = deviceRows.find((device) => device.id === editingId)

    const nextDevice: DeviceRow = {
      id: editingId ?? generateId(),
      deviceCode: form.deviceCode.trim(),
      name: form.name.trim(),
      houseName: form.houseName.trim(),
      loadName: form.loadName.trim(),
      status: form.status,
      powerW: Number(form.powerW || 0),
      relayStatus: form.relayStatus,
      lastUpdate: existingDevice?.lastUpdate ?? "Baru ditambahkan",
      note: form.note.trim(),
    }

    setDeviceRows((current) => {
      if (editingId) {
        return current.map((device) =>
          device.id === editingId ? nextDevice : device
        )
      }

      return [nextDevice, ...current]
    })

    setCurrentPage(1)
    resetForm()
    setOpen(false)
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
                  <Label htmlFor="device-house">Rumah</Label>
                  <Input
                    id="device-house"
                    value={form.houseName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        houseName: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Rumah Melati 12"
                    required
                  />
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
                      <SelectItem value="Perlu Cek">Perlu Cek</SelectItem>
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
                    <SelectItem value="Perlu Cek">Perlu Cek</SelectItem>
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
                      <TableRow key={device.id}>
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

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={device.relayStatus === "ON"}
                              disabled={device.status === "Offline"}
                              onCheckedChange={(checked) =>
                                handleToggleRelay(device.id, checked)
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

                        <TableCell className="text-right">
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
                        Tidak ada data perangkat yang sesuai dengan pencarian.
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