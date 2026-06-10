"use client"

import { useEffect, useMemo, useState } from "react"
import { SectionShell } from "@/components/section-shell"
import {
  apiRequest,
  extractArray,
  getNumber,
  getString,
} from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  Activity,
  Calendar,
  Gauge,
  Wallet,
  Zap,
} from "lucide-react"

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
}

type UsageHistory = {
  id: string
  houseId: string
  deviceId: string
  date: string
  energyKwh: number
  cost: number
  avgPower: number
  maxPower: number
  relayOnDuration: string
  status: "Normal" | "Tinggi"
}

type MonthlyUsage = {
  houseId: string
  deviceId: string
  month: string
  energyKwh: number
  cost: number
}

const electricityRate = 1444.7

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
  },
  {
    id: "device-2",
    houseId: "rumah-2",
    name: "ESP32 Kamar Utama",
    deviceCode: "A12B45C78D90",
    loadName: "Kipas Angin",
    status: "Offline",
  },
]

const usageHistory: UsageHistory[] = [
  {
    id: "1",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "01 Jun",
    energyKwh: 1.8,
    cost: 2600,
    avgPower: 240,
    maxPower: 310,
    relayOnDuration: "6 jam 20 menit",
    status: "Normal",
  },
  {
    id: "2",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "02 Jun",
    energyKwh: 2.1,
    cost: 3034,
    avgPower: 265,
    maxPower: 340,
    relayOnDuration: "7 jam 10 menit",
    status: "Normal",
  },
  {
    id: "3",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "03 Jun",
    energyKwh: 2.7,
    cost: 3901,
    avgPower: 310,
    maxPower: 420,
    relayOnDuration: "8 jam 05 menit",
    status: "Tinggi",
  },
  {
    id: "4",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "04 Jun",
    energyKwh: 1.9,
    cost: 2745,
    avgPower: 250,
    maxPower: 330,
    relayOnDuration: "6 jam 45 menit",
    status: "Normal",
  },
  {
    id: "5",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "05 Jun",
    energyKwh: 2.4,
    cost: 3467,
    avgPower: 285,
    maxPower: 380,
    relayOnDuration: "7 jam 50 menit",
    status: "Normal",
  },
  {
    id: "6",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "06 Jun",
    energyKwh: 3.1,
    cost: 4478,
    avgPower: 340,
    maxPower: 460,
    relayOnDuration: "9 jam 15 menit",
    status: "Tinggi",
  },
  {
    id: "7",
    houseId: "rumah-1",
    deviceId: "device-1",
    date: "07 Jun",
    energyKwh: 2.2,
    cost: 3178,
    avgPower: 270,
    maxPower: 350,
    relayOnDuration: "7 jam 25 menit",
    status: "Normal",
  },
  {
    id: "8",
    houseId: "rumah-2",
    deviceId: "device-2",
    date: "01 Jun",
    energyKwh: 1.4,
    cost: 2023,
    avgPower: 190,
    maxPower: 260,
    relayOnDuration: "5 jam 10 menit",
    status: "Normal",
  },
  {
    id: "9",
    houseId: "rumah-2",
    deviceId: "device-2",
    date: "02 Jun",
    energyKwh: 1.6,
    cost: 2312,
    avgPower: 210,
    maxPower: 280,
    relayOnDuration: "5 jam 50 menit",
    status: "Normal",
  },
]

const monthlyUsage: MonthlyUsage[] = [
  {
    houseId: "rumah-1",
    deviceId: "device-1",
    month: "Jan",
    energyKwh: 54,
    cost: 78014,
  },
  {
    houseId: "rumah-1",
    deviceId: "device-1",
    month: "Feb",
    energyKwh: 49,
    cost: 70790,
  },
  {
    houseId: "rumah-1",
    deviceId: "device-1",
    month: "Mar",
    energyKwh: 58,
    cost: 83793,
  },
  {
    houseId: "rumah-1",
    deviceId: "device-1",
    month: "Apr",
    energyKwh: 61,
    cost: 88127,
  },
  {
    houseId: "rumah-1",
    deviceId: "device-1",
    month: "Mei",
    energyKwh: 57,
    cost: 82348,
  },
  {
    houseId: "rumah-1",
    deviceId: "device-1",
    month: "Jun",
    energyKwh: 16.2,
    cost: 23404,
  },
  {
    houseId: "rumah-2",
    deviceId: "device-2",
    month: "Jan",
    energyKwh: 38,
    cost: 54899,
  },
  {
    houseId: "rumah-2",
    deviceId: "device-2",
    month: "Feb",
    energyKwh: 41,
    cost: 59232,
  },
  {
    houseId: "rumah-2",
    deviceId: "device-2",
    month: "Mar",
    energyKwh: 36,
    cost: 52009,
  },
]

const chartConfig = {
  energyKwh: {
    label: "Energi",
    color: "var(--chart-1)",
  },
  cost: {
    label: "Biaya",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function mapHouse(item: unknown, index: number): House {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], `rumah-${index}`),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
    owner: getString(item, ["owner", "pemilik", "username", "nama_user"], "-"),
  }
}

function mapDevice(item: unknown, index: number): Device {
  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id", "device_id"], `device-${index}`),
    houseId: getString(item, ["houseId", "id_rumah", "rumah_id"], ""),
    name: getString(item, ["name", "nama", "nama_perangkat"], "-"),
    deviceCode: getString(item, ["deviceCode", "device_id", "kode_perangkat", "mac_address"], "-"),
    loadName: getString(item, ["loadName", "nama_beban", "beban"], "-"),
    status: getString(item, ["status", "status_perangkat"], "Online").toLowerCase().includes("offline")
      ? "Offline"
      : "Online",
  }
}

function mapUsageHistory(item: unknown, index: number): UsageHistory {
  const energyKwh = getNumber(item, ["energyKwh", "energy", "energi", "kwh"], 0)
  const power = getNumber(item, ["avgPower", "power", "daya"], 0)
  const maxPower = getNumber(item, ["maxPower", "daya_maksimum"], power)

  return {
    id: getString(item, ["id"], `history-${index}`),
    houseId: getString(item, ["houseId", "id_rumah", "rumah_id"], ""),
    deviceId: getString(item, ["deviceId", "id_perangkat", "perangkat_id", "device_id"], ""),
    date: getString(item, ["date", "tanggal", "created_at", "waktu"], String(index + 1)),
    energyKwh,
    cost: getNumber(item, ["cost", "biaya"], energyKwh * electricityRate),
    avgPower: power,
    maxPower,
    relayOnDuration: getString(item, ["relayOnDuration", "durasi_on"], "-"),
    status: energyKwh >= 2.5 || maxPower >= 400 ? "Tinggi" : "Normal",
  }
}

function mapMonthlyUsage(item: unknown, index: number): MonthlyUsage {
  const energyKwh = getNumber(item, ["energyKwh", "energy", "energi", "kwh", "prediksi_kwh"], 0)

  return {
    houseId: getString(item, ["houseId", "id_rumah", "rumah_id"], ""),
    deviceId: getString(item, ["deviceId", "id_perangkat", "perangkat_id", "device_id"], ""),
    month: getString(item, ["month", "bulan", "periode"], String(index + 1)),
    energyKwh,
    cost: getNumber(item, ["cost", "biaya"], energyKwh * electricityRate),
  }
}

export default function Page() {
  const [houseRows, setHouseRows] = useState<House[]>(houses)
  const [deviceRows, setDeviceRows] = useState<Device[]>(devices)
  const [historyRows, setHistoryRows] = useState<UsageHistory[]>(usageHistory)
  const [monthlyRows, setMonthlyRows] = useState<MonthlyUsage[]>(monthlyUsage)
  const [selectedHouseId, setSelectedHouseId] = useState(houses[0].id)
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0].id)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function loadHistoryData() {
      setIsLoading(true)
      setErrorMessage("")

      try {
        const [housePayload, devicePayload, historyPayload, monthlyPayload] =
          await Promise.all([
            apiRequest<unknown>("/api/rumah"),
            apiRequest<unknown>("/api/perangkat"),
            apiRequest<unknown>("/api/data-listrik", {
              method: "POST",
              body: JSON.stringify({}),
            }),
            apiRequest<unknown>("/api/prediksi-bulanan"),
          ])

        const nextHouses = extractArray(housePayload).map(mapHouse)
        const nextDevices = extractArray(devicePayload).map(mapDevice)

        setHouseRows(nextHouses)
        setDeviceRows(nextDevices)
        setHistoryRows(extractArray(historyPayload).map(mapUsageHistory))
        setMonthlyRows(extractArray(monthlyPayload).map(mapMonthlyUsage))
        setSelectedHouseId(nextHouses[0]?.id ?? "")
        setSelectedDeviceId(nextDevices[0]?.id ?? "")
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil riwayat pemakaian."
        )
        setHouseRows([])
        setDeviceRows([])
        setHistoryRows([])
        setMonthlyRows([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadHistoryData()
  }, [])

  const availableDevices = deviceRows.filter(
    (device) => device.houseId === selectedHouseId
  )

  const selectedHouse =
    houseRows.find((house) => house.id === selectedHouseId) ?? houseRows[0]

  const selectedDevice =
    availableDevices.find((device) => device.id === selectedDeviceId) ??
    availableDevices[0]

  const filteredHistory = historyRows.filter(
    (item) =>
      (!item.houseId || item.houseId === selectedHouseId) &&
      (!item.deviceId || item.deviceId === selectedDevice?.id)
  )

  const filteredMonthlyUsage = monthlyRows.filter(
    (item) =>
      (!item.houseId || item.houseId === selectedHouseId) &&
      (!item.deviceId || item.deviceId === selectedDevice?.id)
  )

  const summary = useMemo(() => {
    const totalEnergy = filteredHistory.reduce(
      (total, item) => total + item.energyKwh,
      0
    )

    const totalCost = filteredHistory.reduce(
      (total, item) => total + item.cost,
      0
    )

    const averageDailyUsage =
      filteredHistory.length > 0 ? totalEnergy / filteredHistory.length : 0

    const maxPower =
      filteredHistory.length > 0
        ? Math.max(...filteredHistory.map((item) => item.maxPower))
        : 0

    return {
      totalEnergy,
      totalCost,
      averageDailyUsage,
      maxPower,
    }
  }, [filteredHistory])

  const handleHouseChange = (houseId: string) => {
    setSelectedHouseId(houseId)

    const firstDevice = deviceRows.find((device) => device.houseId === houseId)

    if (firstDevice) {
      setSelectedDeviceId(firstDevice.id)
    }
  }

  const getStatusBadge = (status: UsageHistory["status"]) => {
    return status === "Tinggi" ? "destructive" : "secondary"
  }

  if (!selectedDevice) {
    return (
      <SectionShell>
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Mengambil riwayat pemakaian dari server..."
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
            Riwayat Pemakaian
          </h1>
          <p className="text-muted-foreground">
            Lihat histori konsumsi listrik berdasarkan rumah dan perangkat.
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
            <CardTitle>Filter Riwayat</CardTitle>
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

        {/* Info Perangkat */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perangkat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Rumah</p>
                <p className="font-semibold">{selectedHouse.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Pemilik</p>
                <p className="font-semibold">{selectedHouse.owner}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Perangkat</p>
                <p className="font-semibold">{selectedDevice.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Device ID</p>
                <p className="font-mono text-sm font-semibold">
                  {selectedDevice.deviceCode}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Nama Beban</p>
                <p className="font-semibold">{selectedDevice.loadName}</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Energi
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalEnergy.toFixed(2)} kWh
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Total pemakaian pada periode data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimasi Biaya
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalCost)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tarif simulasi Rp{electricityRate.toLocaleString("id-ID")}/kWh
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rata-rata Harian
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.averageDailyUsage.toFixed(2)} kWh
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Rata-rata pemakaian per hari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daya Tertinggi
              </CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.maxPower} W</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Daya tertinggi yang tercatat
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pemakaian Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart
                  accessibilityLayer
                  data={filteredHistory}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={18}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="energyKwh"
                    fill="var(--color-energyKwh)"
                    name="Energi"
                    radius={[8, 8, 0, 0]}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tren Pemakaian Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <AreaChart
                  accessibilityLayer
                  data={filteredMonthlyUsage}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    type="natural"
                    dataKey="energyKwh"
                    fill="var(--color-energyKwh)"
                    fillOpacity={0.35}
                    stroke="var(--color-energyKwh)"
                    name="Energi"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tabel Riwayat Pemakaian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Energi</TableHead>
                    <TableHead>Biaya</TableHead>
                    <TableHead>Daya Rata-rata</TableHead>
                    <TableHead>Daya Maksimum</TableHead>
                    <TableHead>Durasi ON</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell>{item.energyKwh} kWh</TableCell>
                      <TableCell>{formatCurrency(item.cost)}</TableCell>
                      <TableCell>{item.avgPower} W</TableCell>
                      <TableCell>{item.maxPower} W</TableCell>
                      <TableCell>{item.relayOnDuration}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredHistory.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        Belum ada data riwayat pemakaian.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
