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

  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [lastSync, setLastSync] = React.useState("")

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const [
        devicePayload,
        historyPayload,
      ] = await Promise.all([
        apiRequest<unknown>("/api/perangkat"),
        apiRequest<unknown>("/api/data-listrik/history?limit=120"),
      ])

      const deviceRows = extractArray(devicePayload).map(mapDevice)
      const logRows = extractArray(historyPayload).map(mapElectricityLog)

      setDevices(deviceRows)
      setLogs(logRows)
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
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    if (devices.length === 0) {
      config.power = { label: "Daya", color: "var(--chart-1)" }
    } else {
      devices.forEach((device, index) => {
        const safeKey = device.deviceCode.replace(/[^a-zA-Z0-9]/g, "_")
        config[safeKey] = {
          label: device.name || device.deviceCode,
          color: `var(--chart-${(index % 5) + 1})`,
        }
      })
    }
    return config
  }, [devices])

  const logsByTime = new Map<string, Record<string, any>>()
  logs.slice()
    .sort((first, second) => getTimeValue(first.time) - getTimeValue(second.time))
    .forEach((item) => {
      const t = formatTime(item.time)
      if (!logsByTime.has(t)) logsByTime.set(t, { time: t })
      const safeKey = item.deviceId ? item.deviceId.replace(/[^a-zA-Z0-9]/g, "_") : "power"
      logsByTime.get(t)![safeKey] = item.power
    })
  const chartRows = Array.from(logsByTime.values()).slice(-30)

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

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Grafik Daya Realtime</CardTitle>
            <CardDescription>
              Data terbaru dari histori listrik yang tersimpan di database.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-5">
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
                      width={36}
                      domain={[0, "auto"]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    {devices.length === 0 ? (
                      <Area
                        dataKey="power"
                        type="monotone"
                        fill="var(--color-power)"
                        fillOpacity={0.35}
                        stroke="var(--color-power)"
                      />
                    ) : (
                      devices.map((device) => {
                        const safeKey = device.deviceCode.replace(/[^a-zA-Z0-9]/g, "_")
                        return (
                          <Area
                            key={safeKey}
                            dataKey={safeKey}
                            name={device.name || device.deviceCode}
                            type="monotone"
                            fill={`var(--color-${safeKey})`}
                            fillOpacity={0.35}
                            stroke={`var(--color-${safeKey})`}
                            connectNulls={true}
                          />
                        )
                      })
                    )}
                    <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[350px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground md:h-[410px]">
                  Belum ada data listrik terbaru.
                </div>
              )}
            </CardContent>
          </Card>

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
