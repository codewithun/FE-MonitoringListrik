"use client"

import * as React from "react"
import { Activity, Gauge, Power, Zap, Cpu, Home, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type RelayStatus = "ON" | "OFF"

type ElectricityLog = {
  id: string
  deviceId: string
  deviceName: string
  houseName: string
  time: string
  voltage: number
  current: number
  power: number
  energy: number
  frequency: number
  powerFactor: number
  relayStatus: RelayStatus
}

function mapElectricityLog(item: unknown, index: number): ElectricityLog {
  const relayOn = getBoolean(item, ["relay", "status_relay", "relay_status"], false)
  const rawTime = getString(
    item,
    ["time", "waktu", "waktu_baca", "created_at", "timestamp"],
    String(index + 1)
  )

  return {
    id: getString(item, ["id"], `${rawTime}-${index}`),
    deviceId: getString(item, ["deviceId", "device_id"], "-"),
    deviceName: getString(item, ["nama_perangkat", "deviceName"], "-"),
    houseName: getString(item, ["nama_rumah", "houseName"], "-"),
    time: formatTime(rawTime),
    voltage: getNumber(item, ["voltage", "tegangan"], 0),
    current: getNumber(item, ["current", "arus"], 0),
    power: getNumber(item, ["power", "daya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh"], 0),
    frequency: getNumber(item, ["frequency", "frekuensi"], 0),
    powerFactor: getNumber(item, ["powerFactor", "power_factor", "pf", "faktor_daya"], 0),
    relayStatus: relayOn ? "ON" : "OFF",
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

export default function Page() {
  const tableViewportRef = React.useRef<HTMLDivElement>(null)
  const [electricityRows, setElectricityRows] = React.useState<ElectricityLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [lastSync, setLastSync] = React.useState("")
  
  const [devices, setDevices] = React.useState<{ id: string; name: string }[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  const [comboboxOpen, setComboboxOpen] = React.useState(false)
  const limit = 10

  React.useEffect(() => {
    async function fetchDevices() {
      try {
        const payload = await apiRequest<unknown>("/api/perangkat")
        const arr = extractArray(payload)
        setDevices(arr.map((d: any) => ({
          id: d.device_id,
          name: d.nama_perangkat || d.device_id
        })))
      } catch {
        // ignore
      }
    }
    void fetchDevices()
  }, [])

  const loadLatestElectricity = React.useCallback(async (page: number, deviceId: string) => {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (deviceId !== "all") {
        query.append("deviceId", deviceId)
      }
      const payload = await apiRequest<any>(`/api/data-listrik/history?${query.toString()}`)
      setElectricityRows(extractArray(payload.data || payload).map(mapElectricityLog))
      if (payload.pagination) {
        // Batasi maksimal halaman hanya sampai 10 sesuai permintaan
        setTotalPages(Math.min(payload.pagination.totalPages, 10))
        setTotalItems(payload.pagination.total)
      }
      setErrorMessage("")
      setLastSync(formatTime(new Date().toISOString()))
    } catch {
      // Ignore background poll errors to prevent Next.js error overlay
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  React.useEffect(() => {
    void Promise.resolve().then(() => loadLatestElectricity(currentPage, selectedDeviceId))

    const intervalId = window.setInterval(() => {
      // Hanya auto-refresh jika berada di halaman pertama
      if (currentPage === 1) {
        void loadLatestElectricity(1, selectedDeviceId)
      }
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [loadLatestElectricity, currentPage, selectedDeviceId])

  React.useEffect(() => {
    tableViewportRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [electricityRows])

  const latestData = electricityRows[0]

  const metrics = React.useMemo(
    () => [
      {
        label: "Tegangan",
        value: `${latestData?.voltage ?? 0} V`,
        icon: Zap,
      },
      {
        label: "Arus",
        value: `${latestData?.current ?? 0} A`,
        icon: Activity,
      },
      {
        label: "Daya",
        value: `${latestData?.power ?? 0} W`,
        icon: Gauge,
      },
      {
        label: "Energi",
        value: `${latestData?.energy ?? 0} kWh`,
        icon: Power,
      },
    ],
    [latestData]
  )

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Monitoring Realtime
            </h1>
            <p className="text-muted-foreground">
              Data listrik terbaru yang tersimpan di database.
            </p>
          </div>
          <Badge variant="outline" className="flex w-fit items-center gap-2">
            {lastSync ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                Terakhir diperbarui: {lastSync}
              </>
            ) : (
              "Menunggu data..."
            )}
          </Badge>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full md:w-72 items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter:</span>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between bg-white dark:bg-card"
                >
                  {selectedDeviceId === "all"
                    ? "Semua Perangkat"
                    : devices.find((device) => device.id === selectedDeviceId)?.name || "Pilih Perangkat..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari perangkat..." />
                  <CommandList>
                    <CommandEmpty>Perangkat tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="Semua Perangkat"
                        onSelect={() => {
                          setSelectedDeviceId("all")
                          setCurrentPage(1)
                          setComboboxOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDeviceId === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Semua Perangkat
                      </CommandItem>
                      {devices.map((device) => (
                        <CommandItem
                          key={device.id}
                          value={device.name}
                          onSelect={() => {
                            setSelectedDeviceId(device.id)
                            setCurrentPage(1)
                            setComboboxOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedDeviceId === device.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {device.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {latestData && selectedDeviceId !== "all" ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Perangkat:</span>
                <span className="font-semibold text-foreground">{latestData.deviceName}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm">
                <Home className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Lokasi:</span>
                <span className="font-semibold text-foreground">{latestData.houseName}</span>
              </div>
            </div>
          ) : null}
        </div>

        {errorMessage ? (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-sm text-destructive">
              {errorMessage}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Card key={metric.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardDescription>{metric.label}</CardDescription>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl">{metric.value}</CardTitle>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Data Listrik Terbaru</CardTitle>
                <CardDescription>
                  Menampilkan maksimal 10 data terbaru dari database.
                </CardDescription>
              </div>
              <Badge variant="secondary">{electricityRows.length} data</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              ref={tableViewportRef}
              className="max-h-[520px] overflow-auto rounded-md border"
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Perangkat</TableHead>
                    <TableHead>Rumah</TableHead>
                    <TableHead>Tegangan</TableHead>
                    <TableHead>Arus</TableHead>
                    <TableHead>Daya</TableHead>
                    <TableHead>Energi</TableHead>
                    <TableHead>Frekuensi</TableHead>
                    <TableHead>Faktor Daya</TableHead>
                    <TableHead>Relay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {electricityRows.map((data) => (
                    <TableRow key={data.id}>
                      <TableCell className="font-medium">{data.time}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {data.deviceId}
                      </TableCell>
                      <TableCell>{data.deviceName}</TableCell>
                      <TableCell>{data.houseName}</TableCell>
                      <TableCell>{data.voltage} V</TableCell>
                      <TableCell>{data.current} A</TableCell>
                      <TableCell>{data.power} W</TableCell>
                      <TableCell>{data.energy} kWh</TableCell>
                      <TableCell>{data.frequency} Hz</TableCell>
                      <TableCell>{data.powerFactor}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            data.relayStatus === "ON" ? "default" : "secondary"
                          }
                        >
                          {data.relayStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}

                  {electricityRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        {isLoading
                          ? "Mengambil data listrik terbaru..."
                          : "Belum ada data listrik yang tersimpan."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Menampilkan {electricityRows.length > 0 ? (currentPage - 1) * limit + 1 : 0} hingga {Math.min(currentPage * limit, totalItems)} dari {new Intl.NumberFormat('id-ID').format(totalItems)} data
                {currentPage > 1 && (
                  <span className="ml-2 block sm:inline text-xs text-amber-600 font-medium">
                    (Auto-refresh mati saat melihat riwayat)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground font-medium px-2"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                
                <div className="flex items-center justify-center h-8 w-8 rounded-full border bg-slate-50/50 dark:bg-transparent text-sm font-medium">
                  {currentPage}
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground font-medium px-2"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
