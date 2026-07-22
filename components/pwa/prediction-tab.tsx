import * as React from "react"
import { TrendingUp, TrendingDown, Lightbulb, BarChart3, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { Prediction } from "./types"
import { formatCurrency } from "./types"
import { apiRequest } from "@/lib/api-client"

interface PredictionTabProps {
  prediction: Prediction | undefined
  selectedDeviceId?: string
}

export function PredictionTab({ prediction, selectedDeviceId }: PredictionTabProps) {
  const [historyData, setHistoryData] = React.useState<{ month: string; energy: number; type: string }[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

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

  // Update data terakhir grafik dengan prediksi asli jika ada
  const chartData = React.useMemo(() => {
    const data = [...historyData]
    if (prediction?.energy) {
      data.push({
        month: prediction.label ? prediction.label.substring(0, 3) : "Pred",
        energy: prediction.energy,
        type: "prediction"
      })
    }
    return data
  }, [historyData, prediction])

  // Menghitung persentase perubahan (bulan lalu asli vs prediksi asli)
  const prevMonthEnergy = historyData.length > 0 ? historyData[historyData.length - 1].energy : 0
  const currentEnergy = prediction?.energy ?? 0
  const diff = currentEnergy - prevMonthEnergy
  const percentChange = prevMonthEnergy > 0 ? ((diff / prevMonthEnergy) * 100).toFixed(1) : "0.0"
  const isIncrease = diff > 0
  const displayDiff = diff.toFixed(2)

  // Hitung Proyeksi Berjalan (Current Month)
  const currentDate = new Date()
  const currentMonthStr = currentDate.toLocaleString('id-ID', { month: 'short' })
  const currentMonthFull = currentDate.toLocaleString('id-ID', { month: 'long' })
  const currentYear = currentDate.getFullYear()

  const currentMonthHistory = historyData.find(d => d.month === currentMonthStr)
  let projectedEnergy = 0
  let projectedCost = 0
  let isProjectionAvailable = false

  if (currentMonthHistory && currentMonthHistory.energy > 0) {
    const today = Math.max(1, currentDate.getDate())
    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate()
    const tariff = (prediction && prediction.energy > 0) ? (prediction.cost / prediction.energy) : 1444.70

    projectedEnergy = (currentMonthHistory.energy / today) * daysInMonth
    projectedCost = projectedEnergy * tariff
    isProjectionAvailable = true
  }

  return (
    <section className="space-y-4 p-4 pb-24">
      {/* 1A. Proyeksi Bulan Berjalan (Matematika) */}
      {isProjectionAvailable && (
        <Card className="bg-emerald-600 text-white shadow-md border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-white/90 font-medium flex items-center gap-2">
              Proyeksi Akhir Bulan <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">{currentMonthFull} {currentYear}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold tracking-tight">
                {formatCurrency(projectedCost)}
              </p>
              <div className="flex items-center gap-2 text-sm text-white/80 pt-2">
                <span className="font-semibold">{projectedEnergy.toFixed(2)} kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1B. Prediksi Utama (AI) */}
      <Card className="bg-primary text-primary-foreground shadow-md border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BarChart3 className="w-24 h-24" />
        </div>
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-primary-foreground/90 font-medium flex items-center gap-2">
            Prediksi AI <span className="text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground">{prediction?.label || "Bulan Depan"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-1">
            <p className="text-4xl font-bold tracking-tight">
              {formatCurrency(prediction?.cost ?? 0)}
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80 pt-2">
              <span className="font-semibold">{prediction?.energy ?? 0} kWh</span>
              {prediction?.accuracy && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    Akurasi AI {prediction.accuracy}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Perubahan Konsumsi */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Tren Bulan Ini</div>
            <div className={`flex items-center gap-2 text-xl font-bold ${isIncrease ? 'text-destructive' : 'text-emerald-500'}`}>
              {isIncrease ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{Math.abs(Number(percentChange))}%</span>
            </div>
            <p className="text-xs text-muted-foreground">vs bulan sebelumnya</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-center space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Selisih Energi</div>
            <div className={`flex items-center gap-2 text-xl font-bold ${isIncrease ? 'text-destructive' : 'text-emerald-500'}`}>
              <AlertCircle className="w-5 h-5" />
              <span>{isIncrease ? "+" : ""}{displayDiff} kWh</span>
            </div>
            <p className="text-xs text-muted-foreground">dari bulan sebelumnya</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Grafik Riwayat & Prediksi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Riwayat & Prediksi (kWh)
          </CardTitle>
          <CardDescription>Perbandingan konsumsi riil dan prediksi</CardDescription>
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
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.type === 'prediction' ? '#f59e0b' : '#3b82f6'}
                          fillOpacity={entry.type === 'prediction' ? 0.8 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Riwayat Asli</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 opacity-80"></div>
                  <span>Prediksi AI</span>
                </div>
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
            {isIncrease
              ? "Terdapat indikasi kenaikan konsumsi energi sebesar " + percentChange + "%. Kurangi penggunaan perangkat bertenaga besar di jam sibuk (18:00 - 22:00) untuk menekan tagihan Anda."
              : "Konsumsi energi Anda menurun " + Math.abs(Number(percentChange)) + "% dibandingkan bulan lalu. Pertahankan pola penggunaan perangkat Anda saat ini!"}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
