"use client"

import * as React from "react"
import { Activity, Gauge, Power, Zap } from "lucide-react"

import { SectionShell } from "@/components/section-shell"
import {
  apiRequest,
  extractArray,
  getBoolean,
  getNumber,
  getString,
} from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
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

  const loadLatestElectricity = React.useCallback(async () => {
    try {
      const payload = await apiRequest<unknown>("/api/data-listrik/history?limit=10")
      setElectricityRows(extractArray(payload).map(mapElectricityLog))
      setErrorMessage("")
      setLastSync(formatTime(new Date().toISOString()))
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data listrik terbaru."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadLatestElectricity)

    const intervalId = window.setInterval(() => {
      void loadLatestElectricity()
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [loadLatestElectricity])

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
          <Badge variant="outline" className="w-fit">
            {lastSync ? `Update ${lastSync}` : "Menunggu data"}
          </Badge>
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
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
