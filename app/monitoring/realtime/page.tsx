"use client"

import { useEffect, useMemo, useState } from "react"
import { SectionShell } from "@/components/section-shell"
import {
  apiRequest,
  extractArray,
  getBoolean,
  getNumber,
  getString,
} from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  Activity,
  Cpu,
  Gauge,
  Power,
  Zap,
} from "lucide-react"

type RelayStatus = "ON" | "OFF"

type House = {
  id: string
  name: string
  owner: string
}

type Device = {
  id: string
  houseId: string
  name: string
  deviceCode: string
  loadName: string
  status: "Online" | "Offline"
  relayStatus: RelayStatus
  lastUpdate: string
}

type ElectricityLog = {
  time: string
  voltage: number
  current: number
  power: number
  energy: number
  frequency: number
  powerFactor: number
  relayStatus: RelayStatus
}

const houses: House[] = [
  {
    id: "rumah-1",
    name: "Rumah Pak Budi",
    owner: "Budi Santoso",
  },
  {
    id: "rumah-2",
    name: "Rumah Ibu Sari",
    owner: "Sari Wulandari",
  },
]

const devices: Device[] = [
  {
    id: "device-1",
    houseId: "rumah-1",
    name: "ESP32 Ruang Tamu",
    deviceCode: "9454C5A93644",
    loadName: "Lampu Ruang Tamu",
    status: "Online",
    relayStatus: "ON",
    lastUpdate: "14:30:25",
  },
  {
    id: "device-2",
    houseId: "rumah-2",
    name: "ESP32 Kamar Utama",
    deviceCode: "A12B45C78D90",
    loadName: "Kipas Angin",
    status: "Offline",
    relayStatus: "OFF",
    lastUpdate: "13:52:10",
  },
]

const realtimeLogs: ElectricityLog[] = [
  {
    time: "14:29:40",
    voltage: 220,
    current: 1.12,
    power: 246,
    energy: 1.72,
    frequency: 50,
    powerFactor: 0.95,
    relayStatus: "ON",
  },
  {
    time: "14:29:45",
    voltage: 221,
    current: 1.18,
    power: 260,
    energy: 1.73,
    frequency: 50,
    powerFactor: 0.96,
    relayStatus: "ON",
  },
  {
    time: "14:29:50",
    voltage: 219,
    current: 1.08,
    power: 236,
    energy: 1.74,
    frequency: 50,
    powerFactor: 0.94,
    relayStatus: "ON",
  },
  {
    time: "14:29:55",
    voltage: 220,
    current: 1.2,
    power: 264,
    energy: 1.75,
    frequency: 50,
    powerFactor: 0.95,
    relayStatus: "ON",
  },
  {
    time: "14:30:00",
    voltage: 222,
    current: 1.25,
    power: 278,
    energy: 1.76,
    frequency: 50,
    powerFactor: 0.96,
    relayStatus: "ON",
  },
  {
    time: "14:30:05",
    voltage: 220,
    current: 1.17,
    power: 257,
    energy: 1.77,
    frequency: 50,
    powerFactor: 0.95,
    relayStatus: "ON",
  },
  {
    time: "14:30:10",
    voltage: 221,
    current: 1.3,
    power: 287,
    energy: 1.78,
    frequency: 50,
    powerFactor: 0.96,
    relayStatus: "ON",
  },
  {
    time: "14:30:15",
    voltage: 220,
    current: 1.22,
    power: 268,
    energy: 1.79,
    frequency: 50,
    powerFactor: 0.95,
    relayStatus: "ON",
  },
  {
    time: "14:30:20",
    voltage: 219,
    current: 1.15,
    power: 252,
    energy: 1.8,
    frequency: 50,
    powerFactor: 0.94,
    relayStatus: "ON",
  },
  {
    time: "14:30:25",
    voltage: 220,
    current: 1.26,
    power: 277,
    energy: 1.81,
    frequency: 50,
    powerFactor: 0.95,
    relayStatus: "ON",
  },
]

const chartConfig = {
  power: {
    label: "Daya",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

function mapHouse(item: unknown, index: number): House {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], `rumah-${index}`),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
    owner: getString(item, ["owner", "pemilik", "username", "nama_user"], "-"),
  }
}

function mapDevice(item: unknown, index: number): Device {
  const relayOn = getBoolean(item, ["relay", "relay_status", "status_relay"], false)

  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id", "device_id"], `device-${index}`),
    houseId: getString(item, ["houseId", "id_rumah", "rumah_id"], ""),
    name: getString(item, ["name", "nama", "nama_perangkat"], "-"),
    deviceCode: getString(item, ["deviceCode", "device_id", "kode_perangkat", "mac_address"], "-"),
    loadName: getString(item, ["loadName", "nama_beban", "beban"], "-"),
    status: getString(item, ["status", "status_perangkat"], "Online").toLowerCase().includes("offline")
      ? "Offline"
      : "Online",
    relayStatus: relayOn ? "ON" : "OFF",
    lastUpdate: getString(item, ["lastUpdate", "updated_at", "waktu"], "-"),
  }
}

function mapElectricityLog(item: unknown, index: number): ElectricityLog {
  const relayOn = getBoolean(item, ["relay", "relay_status", "status_relay"], true)

  return {
    time: getString(item, ["time", "waktu", "created_at", "timestamp"], String(index + 1)),
    voltage: getNumber(item, ["voltage", "tegangan"], 0),
    current: getNumber(item, ["current", "arus"], 0),
    power: getNumber(item, ["power", "daya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh"], 0),
    frequency: getNumber(item, ["frequency", "frekuensi"], 0),
    powerFactor: getNumber(item, ["powerFactor", "power_factor", "pf", "faktor_daya"], 0),
    relayStatus: relayOn ? "ON" : "OFF",
  }
}

export default function Page() {
  const [houseRows, setHouseRows] = useState<House[]>(houses)
  const [deviceRows, setDeviceRows] = useState<Device[]>(devices)
  const [electricityRows, setElectricityRows] = useState<ElectricityLog[]>(realtimeLogs)
  const [selectedHouseId, setSelectedHouseId] = useState(houses[0].id)
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0].id)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [relayStates, setRelayStates] = useState<Record<string, RelayStatus>>({
    "device-1": "ON",
    "device-2": "OFF",
  })

  useEffect(() => {
    async function loadRealtimeData() {
      setIsLoading(true)
      setErrorMessage("")

      try {
        const [housePayload, devicePayload, electricityPayload, relayPayload] =
          await Promise.all([
            apiRequest<unknown>("/api/rumah"),
            apiRequest<unknown>("/api/perangkat"),
            apiRequest<unknown>("/api/data-listrik/latest"),
            apiRequest<unknown>("/api/relay-state"),
          ])

        const nextHouses = extractArray(housePayload).map(mapHouse)
        const nextDevices = extractArray(devicePayload).map(mapDevice)
        const nextLogs = extractArray(electricityPayload).map(mapElectricityLog)
        const nextRelayStates = Object.fromEntries(
          extractArray(relayPayload).map((item, index) => {
            const id = getString(item, ["id", "id_perangkat", "device_id"], `device-${index}`)
            const status = getBoolean(item, ["relay", "relay_status", "status"], false)

            return [id, status ? "ON" : "OFF"]
          })
        ) as Record<string, RelayStatus>

        setHouseRows(nextHouses)
        setDeviceRows(nextDevices)
        setElectricityRows(nextLogs)
        setRelayStates(nextRelayStates)
        setSelectedHouseId(nextHouses[0]?.id ?? "")
        setSelectedDeviceId(nextDevices[0]?.id ?? "")
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil data realtime."
        )
        setHouseRows([])
        setDeviceRows([])
        setElectricityRows([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadRealtimeData()
  }, [])

  const availableDevices = deviceRows.filter(
    (device) => device.houseId === selectedHouseId
  )

  const selectedHouse =
    houseRows.find((house) => house.id === selectedHouseId) ?? houseRows[0]

  const selectedDevice =
    availableDevices.find((device) => device.id === selectedDeviceId) ??
    availableDevices[0]

  const latestData = electricityRows[electricityRows.length - 1]
  const latestRows = [...electricityRows].reverse().slice(0, 10)

  const currentRelayStatus =
    relayStates[selectedDevice?.deviceCode] ??
    relayStates[selectedDevice?.id] ??
    selectedDevice?.relayStatus ??
    "OFF"

  const metrics = useMemo(
    () => [
      {
        label: "Tegangan",
        value: `${latestData?.voltage ?? 0} V`,
        note: "Voltage listrik saat ini",
        icon: Zap,
      },
      {
        label: "Arus",
        value: `${latestData?.current ?? 0} A`,
        note: "Arus listrik yang terbaca",
        icon: Activity,
      },
      {
        label: "Daya",
        value: `${latestData?.power ?? 0} W`,
        note: "Pemakaian daya realtime",
        icon: Gauge,
      },
      {
        label: "Energi",
        value: `${latestData?.energy ?? 0} kWh`,
        note: "Total energi terpakai",
        icon: Power,
      },
      {
        label: "Frekuensi",
        value: `${latestData?.frequency ?? 0} Hz`,
        note: "Frekuensi jaringan listrik",
        icon: Activity,
      },
      {
        label: "Faktor Daya",
        value: String(latestData?.powerFactor ?? 0),
        note: "Efisiensi pemakaian daya",
        icon: Cpu,
      },
    ],
    [latestData]
  )

  const handleHouseChange = (houseId: string) => {
    setSelectedHouseId(houseId)

    const firstDevice = deviceRows.find((device) => device.houseId === houseId)

    if (firstDevice) {
      setSelectedDeviceId(firstDevice.id)
    }
  }

  const handleToggleRelay = async () => {
    if (!selectedDevice) return
    const nextStatus = currentRelayStatus === "ON" ? "OFF" : "ON"

    setRelayStates((prev) => ({
      ...prev,
      [selectedDevice.id]: nextStatus,
      [selectedDevice.deviceCode]: nextStatus,
    }))

    try {
      await apiRequest("/api/relay-control", {
        method: "POST",
        body: JSON.stringify({
          id: selectedDevice.id,
          device_id: selectedDevice.deviceCode,
          status: nextStatus,
          relay_status: nextStatus,
          relay: nextStatus === "ON",
        }),
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengubah relay."
      )
      setRelayStates((prev) => ({
        ...prev,
        [selectedDevice.id]: currentRelayStatus,
        [selectedDevice.deviceCode]: currentRelayStatus,
      }))
    }
  }

  if (!selectedDevice) {
    return (
      <SectionShell>
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Mengambil data realtime dari server..."
                  : errorMessage || "Tidak ada perangkat pada rumah ini."}
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Monitoring Realtime
          </h1>
          <p className="text-muted-foreground">
            Pantau kondisi listrik, status perangkat, dan kontrol beban secara
            langsung.
          </p>
        </div>

        {errorMessage && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-sm text-destructive">
              {errorMessage}
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Pilih Rumah</p>
                <Select value={selectedHouseId} onValueChange={handleHouseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rumah" />
                  </SelectTrigger>
                  <SelectContent>
                    {houseRows.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pilih Perangkat</p>
                <Select
                  value={selectedDevice.id}
                  onValueChange={setSelectedDeviceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih perangkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Perangkat */}
        <Card>
          <CardHeader>
            <CardTitle>Status Perangkat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Perangkat</p>
                <p className="font-semibold">{selectedDevice.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Device ID</p>
                <p className="font-mono text-sm font-semibold">
                  {selectedDevice.deviceCode}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Rumah</p>
                <p className="font-semibold">{selectedHouse.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Pemilik</p>
                <p className="font-semibold">{selectedHouse.owner}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status Perangkat</p>
                <Badge
                  variant={
                    selectedDevice.status === "Online"
                      ? "default"
                      : "destructive"
                  }
                >
                  {selectedDevice.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Data Terakhir</p>
                <p className="font-semibold">{selectedDevice.lastUpdate}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Nama Beban</p>
                <p className="font-semibold">{selectedDevice.loadName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status Relay</p>
                <Badge
                  variant={currentRelayStatus === "ON" ? "default" : "secondary"}
                >
                  {currentRelayStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Card key={metric.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {metric.note}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Grafik dan Kontrol Relay */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Grafik Daya Realtime</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <LineChart data={electricityRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
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
              <CardTitle>Kontrol Beban</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Beban</p>
                <p className="text-lg font-semibold">{selectedDevice.loadName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status Saat Ini</p>
                <Badge
                  variant={currentRelayStatus === "ON" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {currentRelayStatus}
                </Badge>
              </div>

              <Button
                className="w-full"
                variant={currentRelayStatus === "ON" ? "destructive" : "default"}
                onClick={handleToggleRelay}
              >
                {currentRelayStatus === "ON" ? "Matikan" : "Nyalakan"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Tombol ini digunakan untuk mengontrol relay pada perangkat yang
                sedang dipilih.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Data Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle>Data Listrik Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Tegangan</TableHead>
                  <TableHead>Arus</TableHead>
                  <TableHead>Daya</TableHead>
                  <TableHead>Energi</TableHead>
                  <TableHead>Frekuensi</TableHead>
                  <TableHead>Faktor Daya</TableHead>
                  <TableHead>Status Relay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestRows.map((data) => (
                  <TableRow key={data.time}>
                    <TableCell className="font-medium">{data.time}</TableCell>
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
