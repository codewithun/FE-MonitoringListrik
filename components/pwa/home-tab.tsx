import * as React from "react"
import { Activity, BarChart3, BatteryCharging, Zap, Settings2, Clock } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import type { Device, ElectricityLog } from "./types"

const chartConfig = {
  power: {
    label: "Daya",
    color: "var(--chart-1)",
  },
  energy: {
    label: "Energi",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

interface HomeTabProps {
  devices: Device[]
  logs: ElectricityLog[]
  selectedDeviceId: string
  setSelectedDeviceId: (id: string) => void
  toggleRelay: (device: Device, nextChecked: boolean) => Promise<void>
  hasLinkedHouse: boolean
  onConfigDevice: (device: Device) => void
}

export function HomeTab({
  devices,
  logs,
  selectedDeviceId,
  setSelectedDeviceId,
  toggleRelay,
  hasLinkedHouse,
  onConfigDevice,
}: HomeTabProps) {
  const [deviceSearch, setDeviceSearch] = React.useState("")

  const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId)
  const latestLog = logs[0]

  const filteredDevices = React.useMemo(() => {
    const query = deviceSearch.trim().toLowerCase()
    if (!query) return devices

    return devices.filter((device) =>
      [device.name, device.deviceId, device.houseName, device.relayStatus]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [devices, deviceSearch])

  const metrics = [
    { label: "Tegangan", value: `${latestLog?.voltage ?? 0} V`, icon: Zap },
    { label: "Arus", value: `${latestLog?.current ?? 0} A`, icon: Activity },
    { label: "Energi", value: `${latestLog?.energy ?? 0} kWh`, icon: BatteryCharging },
    { label: "Faktor", value: `${latestLog?.powerFactor ?? 0}`, icon: BarChart3 },
  ]

  return (
    <section className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Perangkat Saya</CardTitle>
              <p className="text-sm text-muted-foreground">
                {devices.length} perangkat terhubung
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={deviceSearch}
            onChange={(event) => setDeviceSearch(event.target.value)}
            placeholder="Cari nama atau ID perangkat"
            className="h-10"
          />
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {filteredDevices.map((device) => {
              const active = device.deviceId === selectedDeviceId

              return (
                <div
                  key={device.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={active}
                  onClick={() => setSelectedDeviceId(device.deviceId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedDeviceId(device.deviceId)
                    }
                  }}
                  className={`flex min-h-16 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors ${active
                    ? "border-primary bg-primary/10"
                    : "bg-background hover:bg-muted/60"
                    }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {device.name}
                      </p>
                      <Badge
                        variant={
                          device.relayStatus === "ON" ? "default" : "secondary"
                        }
                        className="shrink-0"
                      >
                        {device.relayStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {device.deviceId}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="truncate text-xs text-muted-foreground">
                        {device.houseName}
                      </p>
                      {(device.jadwalAktif || device.batasDayaAktif) && (
                        <div className="flex items-center gap-1 border-l pl-2 ml-1 border-border">
                          {device.jadwalAktif && (
                            <Clock className="w-3 h-3 text-primary" aria-label="Jadwal aktif" />
                          )}
                          {device.batasDayaAktif && (
                            <Zap className="w-3 h-3 text-amber-500" aria-label="Batas daya aktif" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onConfigDevice(device)}
                      className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Pengaturan perangkat"
                    >
                      <Settings2 className="w-5 h-5" />
                    </button>
                    <Switch
                      checked={device.relayStatus === "ON"}
                      onCheckedChange={(checked) =>
                        toggleRelay(device, checked)
                      }
                    />
                  </div>
                </div>
              )
            })}
            {devices.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Belum ada perangkat.
              </div>
            ) : null}
            {devices.length > 0 && filteredDevices.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Perangkat tidak ditemukan.
              </div>
            ) : null}
          </div>
        </CardContent>
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
            <Card key={metric.label} className="overflow-hidden">
              <CardContent className="p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Icon className="size-4 text-primary" />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight">{metric.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Grafik Realtime{selectedDevice ? ` - ${selectedDevice.name}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full"
            initialDimension={{ width: 360, height: 220 }}
          >
            <AreaChart
              accessibilityLayer
              data={logs.slice().reverse()}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={18}
              />
              <YAxis width={36} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="power"
                type="monotone"
                fill="var(--color-power)"
                fillOpacity={0.35}
                stroke="var(--color-power)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.slice(0, 3).map((log) => (
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
  )
}
