import * as React from "react"
import { Calendar, History, Zap, Activity } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { apiRequest } from "@/lib/api-client"
import type { Device, ElectricityLog } from "./types"
import { mapElectricityLog } from "./types"

interface HistoryTabProps {
  devices: Device[]
}

export function HistoryTab({ devices }: HistoryTabProps) {
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>(
    devices[0]?.deviceId || ""
  )
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [historyData, setHistoryData] = React.useState<ElectricityLog[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchHistory = React.useCallback(async () => {
    if (!selectedDeviceId || !selectedDate) return

    setIsLoading(true)
    try {
      // Create start and end ISO strings for the selected date
      const start = new Date(`${selectedDate}T00:00:00`).toISOString()
      const end = new Date(`${selectedDate}T23:59:59`).toISOString()

      const res = (await apiRequest(
        `/api/data-listrik/history?deviceId=${selectedDeviceId}&start=${start}&end=${end}&limit=500`
      )) as any

      if (res.success && Array.isArray(res.data)) {
        // Map data and sort chronologically for the chart
        const mappedData = res.data
          .sort((a: any, b: any) => {
            const timeA = new Date(a.waktu_baca || a.created_at || a.time).getTime()
            const timeB = new Date(b.waktu_baca || b.created_at || b.time).getTime()
            return timeA - timeB
          })
          .map(mapElectricityLog)
        setHistoryData(mappedData)
      } else {
        setHistoryData([])
      }
    } catch (error) {
      console.error("Gagal mengambil riwayat:", error)
      setHistoryData([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedDeviceId, selectedDate])

  React.useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Aggregate data for chart (simplify if too many data points)
  const chartData = React.useMemo(() => {
    return historyData.map((log) => {
      // log.time is already formatted like "14.30.00" by mapElectricityLog
      // We can just take the first 5 chars for "HH.mm"
      const timeStr = log.time.substring(0, 5)
      return {
        time: timeStr,
        power: log.power,
        energy: log.energy,
        voltage: log.voltage,
      }
    })
  }, [historyData])

  return (
    <section className="space-y-4 p-4 pb-24">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Riwayat Data</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Pilih Perangkat</Label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih perangkat" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.name}
                  </SelectItem>
                ))}
                {devices.length === 0 && (
                  <SelectItem value="empty" disabled>
                    Belum ada perangkat
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pilih Tanggal</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="power" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="power">Daya (Watt)</TabsTrigger>
          <TabsTrigger value="energy">Energi (kWh)</TabsTrigger>
        </TabsList>

        <TabsContent value="power" className="pt-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Grafik Daya
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  Memuat data...
                </div>
              ) : chartData.length > 0 ? (
                <div className="w-full mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        minTickGap={20}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: "4px" }}
                        itemStyle={{ color: "#f59e0b", fontSize: "14px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="power"
                        name="Daya (W)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPower)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
                  Tidak ada data untuk tanggal ini.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy" className="pt-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Grafik Energi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  Memuat data...
                </div>
              ) : chartData.length > 0 ? (
                <div className="w-full mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        minTickGap={20}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: "4px" }}
                        itemStyle={{ color: "#2563eb", fontSize: "14px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="energy"
                        name="Energi (kWh)"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEnergy)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
                  Tidak ada data untuk tanggal ini.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Detail Data List */}
      {chartData.length > 0 && !isLoading && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rincian Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
              {/* Show in reverse chronological order for list */}
              {[...historyData].reverse().map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 border rounded-md bg-card">
                  <div>
                    <div className="font-medium text-sm">
                      {log.time}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {log.voltage} V • {log.current} A
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-600 text-sm">{log.power} W</div>
                    <div className="text-xs text-primary">{log.energy} kWh</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
