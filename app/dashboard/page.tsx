"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  Bolt,
  Cpu,
  Home,
  RefreshCcw,
  ToggleLeft,
  Users,
  Zap,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

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
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type RelayStatus = "ON" | "OFF"
type DeviceStatus = "Online" | "Offline"

type Device = {
  id: string
  deviceCode: string
  houseId: string
  name: string
  houseName: string
  loadName: string
  status: DeviceStatus
  relayStatus: RelayStatus
}

type ElectricityLog = {
  id: string
  deviceId: string
  houseId: string
  deviceName: string
  houseName: string
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
  energy: number
  cost: number
}

const chartConfig = {
  power: {
    label: "Daya",
    color: "var(--chart-1)",
  },
  voltage: {
    label: "Tegangan",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function normalizeDeviceStatus(status: string): DeviceStatus {
  return status.toLowerCase().includes("offline") ? "Offline" : "Online"
}

function mapDevice(item: unknown, index: number): Device {
  const relayOn = getBoolean(
    item,
    ["relay", "relayStatus", "statusRelay", "relay_status", "status_relay"],
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
    deviceId: getString(item, ["deviceId", "device_id", "kode_perangkat", "mac_address"], ""),
    houseId: getString(item, ["houseId", "rumah_id", "id_rumah"], ""),
    deviceName: getString(item, ["nama_perangkat", "deviceName"], "-"),
    houseName: getString(item, ["nama_rumah", "houseName"], "-"),
    time: rawTime,
    voltage: getNumber(item, ["voltage", "tegangan"], 0),
    current: getNumber(item, ["current", "arus"], 0),
    power: getNumber(item, ["power", "daya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh"], 0),
    frequency: getNumber(item, ["frequency", "frekuensi"], 0),
    powerFactor: getNumber(item, ["powerFactor", "power_factor", "pf", "faktor_daya"], 0),
  }
}

function mapPrediction(item: unknown, index: number): Prediction {
  const energy = getNumber(item, ["energy", "energi", "kwh", "prediksi_kwh"], 0)

  return {
    label: getString(item, ["label", "bulan", "periode"], `Prediksi ${index + 1}`),
    energy,
    cost: getNumber(item, ["cost", "biaya", "prediksi_biaya"], energy * 1445),
  }
}

function getTimeValue(value: string) {
  const parsed = new Date(value).getTime()

  return Number.isNaN(parsed) ? 0 : parsed
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

function formatNumber(value: number, unit = "") {
  return `${value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}${unit ? ` ${unit}` : ""}`
}

function formatCurrency(value: number) {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`
}

function getLatestReadings(readings: ElectricityLog[]) {
  const latestByDevice = new Map<string, ElectricityLog>()

  for (const reading of readings) {
    if (!reading.deviceId) continue

    const current = latestByDevice.get(reading.deviceId)

    if (!current || getTimeValue(reading.time) >= getTimeValue(current.time)) {
      latestByDevice.set(reading.deviceId, reading)
    }
  }

  return latestByDevice
}

export default function Page() {
  const [devices, setDevices] = React.useState<Device[]>([])
  const [logs, setLogs] = React.useState<ElectricityLog[]>([])
  const [predictions, setPredictions] = React.useState<Prediction[]>([])
  const [houseCount, setHouseCount] = React.useState(0)
  const [userCount, setUserCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [lastSync, setLastSync] = React.useState("")

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const [
        devicePayload,
        housePayload,
        userPayload,
        historyPayload,
        predictionPayload,
      ] = await Promise.all([
        apiRequest<unknown>("/api/perangkat"),
        apiRequest<unknown>("/api/rumah").catch(() => null),
        apiRequest<unknown>("/api/users").catch(() => null),
        apiRequest<unknown>("/api/data-listrik/history?limit=120"),
        apiRequest<unknown>("/api/prediksi-bulanan").catch(() => null),
      ])

      const deviceRows = extractArray(devicePayload).map(mapDevice)
      const logRows = extractArray(historyPayload).map(mapElectricityLog)
      const endpointPredictions = extractArray(predictionPayload).map(mapPrediction)

      setDevices(deviceRows)
      setHouseCount(extractArray(housePayload).length)
      setUserCount(extractArray(userPayload).length)
      setLogs(logRows)
      setPredictions(endpointPredictions)
      setLastSync(formatTime(new Date().toISOString()))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil data dashboard."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadDashboard)

    const intervalId = window.setInterval(() => {
      void loadDashboard()
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [loadDashboard])

  const latestByDevice = React.useMemo(() => getLatestReadings(logs), [logs])
  const latestReadings = React.useMemo(
    () =>
      Array.from(latestByDevice.values()).sort(
        (first, second) => getTimeValue(second.time) - getTimeValue(first.time)
      ),
    [latestByDevice]
  )
  const latestLog = latestReadings[0]
  const totalPower = latestReadings.reduce((total, reading) => total + reading.power, 0)
  const totalEnergy = latestReadings.reduce((total, reading) => total + reading.energy, 0)
  const onlineDevices = devices.filter((device) => device.status === "Online").length
  const relayOnDevices = devices.filter((device) => device.relayStatus === "ON").length
  const offlineDevices = devices.length - onlineDevices
  const prediction = predictions[0]
  const chartRows = logs
    .slice()
    .sort((first, second) => getTimeValue(first.time) - getTimeValue(second.time))
    .slice(-30)
    .map((item) => ({
      time: formatTime(item.time),
      power: item.power,
      voltage: item.voltage,
    }))

  const topDevices = devices
    .map((device) => ({
      ...device,
      latest: latestByDevice.get(device.deviceCode),
    }))
    .sort((first, second) => (second.latest?.power ?? 0) - (first.latest?.power ?? 0))
    .slice(0, 6)

  const stats = [
    {
      label: "Daya Saat Ini",
      value: formatNumber(totalPower, "W"),
      note: latestLog ? `Update ${formatTime(latestLog.time)}` : "Menunggu data listrik",
      icon: Zap,
    },
    {
      label: "Energi Tercatat",
      value: formatNumber(totalEnergy, "kWh"),
      note: `${latestReadings.length} perangkat punya data terbaru`,
      icon: Bolt,
    },
    {
      label: "Perangkat Online",
      value: `${onlineDevices}/${devices.length}`,
      note: offlineDevices > 0 ? `${offlineDevices} perangkat offline` : "Semua perangkat aktif",
      icon: Cpu,
    },
    {
      label: "Relay ON",
      value: String(relayOnDevices),
      note: "Beban yang sedang dinyalakan",
      icon: ToggleLeft,
    },
  ]

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan realtime monitoring listrik, perangkat, dan prediksi biaya.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {lastSync ? `Update ${lastSync}` : "Menunggu sinkronisasi"}
            </Badge>
            <Button variant="outline" onClick={loadDashboard} disabled={isLoading}>
              <RefreshCcw className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <Card className="border-destructive/50">
            <CardContent className="flex items-center gap-2 pt-6 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {errorMessage}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card key={stat.label} className="h-full min-h-32">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardDescription>{stat.label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid items-stretch gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle>Grafik Daya Realtime</CardTitle>
              <CardDescription>
                Data terbaru dari histori listrik yang tersimpan di database.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 p-4 md:p-5">
              {chartRows.length > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="h-[350px] w-full md:h-[410px]"
                  initialDimension={{ width: 900, height: 410 }}
                >
                  <AreaChart
                    accessibilityLayer
                    data={chartRows}
                    margin={{
                      top: 4,
                      left: 4,
                      right: 8,
                      bottom: 0,
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
                    <YAxis
                      yAxisId="power"
                      width={36}
                      domain={[0, "auto"]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="voltage"
                      orientation="right"
                      domain={[0, "auto"]}
                      hide
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      yAxisId="power"
                      dataKey="power"
                      type="monotone"
                      fill="var(--color-power)"
                      fillOpacity={0.35}
                      stroke="var(--color-power)"
                    />
                    <Area
                      yAxisId="voltage"
                      dataKey="voltage"
                      type="monotone"
                      fill="var(--color-voltage)"
                      fillOpacity={0.2}
                      stroke="var(--color-voltage)"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[350px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground md:h-[410px]">
                  Belum ada data listrik terbaru.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Lingkup Sistem</CardTitle>
                <CardDescription>Data master yang terdaftar.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm">User</span>
                  </div>
                  <span className="font-semibold">{userCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Home className="size-4 text-muted-foreground" />
                    <span className="text-sm">Rumah</span>
                  </div>
                  <span className="font-semibold">{houseCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Activity className="size-4 text-muted-foreground" />
                    <span className="text-sm">Data realtime</span>
                  </div>
                  <span className="font-semibold">{logs.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Prediksi Biaya</CardTitle>
                <CardDescription>Estimasi dari endpoint prediksi bulanan.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-muted-foreground">
                  {prediction?.label || "Belum ada prediksi"}
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(prediction?.cost ?? 0)}
                </p>
                <p className="mt-1 pb-4 text-sm text-muted-foreground">
                  Estimasi energi {formatNumber(prediction?.energy ?? 0, "kWh")}.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Perangkat Dengan Beban Tertinggi</CardTitle>
            <CardDescription>
              Diurutkan berdasarkan data daya terbaru per perangkat.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Perangkat</TableHead>
                    <TableHead>Rumah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Daya</TableHead>
                    <TableHead>Energi</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDevices.length > 0 ? (
                    topDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-mono text-sm">
                          {device.deviceCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {device.name}
                          {device.loadName !== "-" ? (
                            <span className="block text-xs text-muted-foreground">
                              {device.loadName}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{device.houseName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              device.status === "Online" ? "default" : "destructive"
                            }
                          >
                            {device.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatNumber(device.latest?.power ?? 0, "W")}</TableCell>
                        <TableCell>{formatNumber(device.latest?.energy ?? 0, "kWh")}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {device.latest ? formatTime(device.latest.time) : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {isLoading ? "Mengambil data dashboard..." : "Belum ada perangkat."}
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
