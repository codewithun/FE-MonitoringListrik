import * as React from "react"
import { TrendingUp, TrendingDown, BarChart3, AlertCircle, Lightbulb, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { Prediction } from "./types"
import { formatCurrency } from "./types"
import { apiRequest } from "@/lib/api-client"

interface PredictionTabProps {
  predictions: Prediction[]
  selectedDeviceId?: string
}

export function PredictionTab({ predictions, selectedDeviceId }: PredictionTabProps) {
  const [historyData, setHistoryData] = React.useState<{ month: string; energy: number; type: string }[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedMonth, setSelectedMonth] = React.useState<string>("all")

  React.useEffect(() => {
    async function loadMonthlyHistory() {
      setIsLoading(true)
      try {
        const query = selectedDeviceId ? `?deviceId=${selectedDeviceId}` : ""
        const res = await apiRequest(`/api/data-listrik/history-monthly${query}`) as { success: boolean; data: any[] }

        let mappedData: { month: string; energy: number; type: string }[] = []
        if (res.success && Array.isArray(res.data)) {
          mappedData = res.data.map(item => ({
            month: item.month,
            energy: Number(item.energy) || 0,
            type: "history"
          }))
        }
        setHistoryData(mappedData)
      } catch (error) {
        console.error("Gagal mengambil histori bulanan", error)
        setHistoryData([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadMonthlyHistory()
  }, [selectedDeviceId])

  const currentDate = new Date()
  const currentMonthStr = currentDate.toLocaleString('id-ID', { month: 'short' })
  const currentMonthFull = currentDate.toLocaleString('id-ID', { month: 'long' })
  const currentYear = currentDate.getFullYear()
  const currentMonthNum = currentDate.getMonth() + 1

  const nextMonthDate = new Date(currentYear, currentMonthNum, 1)
  const nextMonthNum = nextMonthDate.getMonth() + 1
  const nextYearNum = nextMonthDate.getFullYear()
  const nextMonthStr = nextMonthDate.toLocaleString('id-ID', { month: 'short' })
  const nextMonthFull = nextMonthDate.toLocaleString('id-ID', { month: 'long' })

  const currentMonthPrediction = predictions.find(p => p.month === currentMonthNum && p.year === currentYear)
  const nextMonthPrediction = predictions.find(p => p.month === nextMonthNum && p.year === nextYearNum)

  // Update data terakhir grafik dengan prediksi asli jika ada
  const chartData = React.useMemo(() => {
    const data = [...historyData]
    if (currentMonthPrediction?.energy) {
      // Find if we already have a history element for the current month
      const existingIdx = data.findIndex(d => d.month === currentMonthStr)
      if (existingIdx !== -1) {
        // Replace it with prediction
        data[existingIdx] = {
          month: currentMonthStr,
          energy: currentMonthPrediction.energy,
          type: "prediction_current"
        }
      } else {
        data.push({
          month: currentMonthStr,
          energy: currentMonthPrediction.energy,
          type: "prediction_current"
        })
      }
    }
    if (nextMonthPrediction?.energy) {
      data.push({
        month: nextMonthStr,
        energy: nextMonthPrediction.energy,
        type: "prediction"
      })
    }
    return data
  }, [historyData, currentMonthPrediction, nextMonthPrediction, currentMonthStr, nextMonthStr])



  let tariff = 1444.70
  if (currentMonthPrediction && currentMonthPrediction.energy > 0) {
    tariff = currentMonthPrediction.cost / currentMonthPrediction.energy
  } else if (nextMonthPrediction && nextMonthPrediction.energy > 0) {
    tariff = nextMonthPrediction.cost / nextMonthPrediction.energy
  }

  return (
    <section className="space-y-4 p-4">
      {/* 1A. Prediksi Bulan Berjalan (AI) */}
      {currentMonthPrediction && (
        <Card className="bg-card text-card-foreground shadow-sm border overflow-hidden relative">
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="font-medium flex items-center gap-2">
              Prediksi Bulan Berjalan <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{currentMonthFull} {currentYear}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold tracking-tight text-primary">
                {formatCurrency(currentMonthPrediction.cost)}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <span className="font-semibold text-foreground">{currentMonthPrediction.energy.toFixed(2)} kWh</span>
                {currentMonthPrediction.accuracy && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      Akurasi AI {currentMonthPrediction.accuracy}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1B. Prediksi Utama Bulan Depan (AI) */}
      {nextMonthPrediction && (
        <Card className="bg-primary text-primary-foreground shadow-md border-none overflow-hidden relative">
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-primary-foreground/90 font-medium flex items-center gap-2">
              Prediksi Bulan Depan <span className="text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground">{nextMonthFull} {nextYearNum}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold tracking-tight">
                {formatCurrency(nextMonthPrediction.cost)}
              </p>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80 pt-2">
                <span className="font-semibold">{nextMonthPrediction.energy.toFixed(2)} kWh</span>
                {nextMonthPrediction.accuracy && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      Akurasi AI {nextMonthPrediction.accuracy}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentMonthPrediction && !nextMonthPrediction && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground text-sm space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto opacity-50" />
            <p>Belum ada data prediksi dari AI.</p>
            <p className="text-xs">Sistem memerlukan histori penggunaan beberapa hari sebelum AI dapat memprediksi biaya bulanan Anda.</p>
          </CardContent>
        </Card>
      )}

      {/* 2. Rekap Bulanan */}
      {historyData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Rekap Pemakaian
              </CardTitle>
              <CardDescription>Tagihan riil Anda</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[125px] h-8 text-xs">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {historyData.slice().reverse().map(d => (
                  <SelectItem key={d.month} value={d.month}>{d.month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {historyData
                .slice()
                .reverse()
                .filter(d => selectedMonth === "all" || d.month === selectedMonth)
                .map((data, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{data.month}</span>
                      <span className="text-xs text-muted-foreground">{data.energy.toFixed(2)} kWh</span>
                    </div>
                    <div className="font-bold text-sm text-right">
                      {formatCurrency(data.energy * tariff)}
                      {data.month === currentMonthStr && (
                        <div className="text-[10px] text-emerald-600 font-normal mt-0.5">Berjalan</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* 3. Grafik Riwayat & Prediksi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Riwayat & Prediksi (kWh)
          </CardTitle>
          <CardDescription>Perbandingan konsumsi riil dan prediksi AI</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground mt-2">
              Memuat histori...
            </div>
          ) : (
            <>
              <div className="w-full mt-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: "4px" }}
                    />
                    <Bar dataKey="energy" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => {
                        let fillColor = '#3b82f6'; // blue for history
                        if (entry.type === 'prediction_current') fillColor = '#10b981'; // emerald for current month prediction
                        if (entry.type === 'prediction') fillColor = '#f59e0b'; // amber for next month prediction
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={fillColor}
                            fillOpacity={entry.type !== 'history' ? 0.9 : 1}
                          />
                        )
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span>Riwayat Asli</span>
                </div>
                {currentMonthPrediction && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-90"></div>
                    <span>Prediksi Bulan Ini</span>
                  </div>
                )}
                {nextMonthPrediction && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-90"></div>
                    <span>Prediksi Bulan Depan</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 4. Insight / Tips Cerdas */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-500">
            <Lightbulb className="w-4 h-4" /> WattWise Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
            Selalu pantau prediksi AI dan kurangi penggunaan perangkat bertenaga besar di jam sibuk (18:00 - 22:00) untuk menjaga tagihan listrik Anda tetap hemat!
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
