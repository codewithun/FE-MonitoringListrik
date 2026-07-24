"use client"

import * as React from "react"
import { toast } from "sonner"
import { AlertTriangle, Search } from "lucide-react"

import { SectionShell } from "@/components/section-shell"
import { apiRequest, extractArray, getBoolean, getNumber, getString } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DeviceRow = {
  id: string
  deviceCode: string
  name: string
  houseName: string
  powerW: number
  relayStatus: "ON" | "OFF"
  batasDaya: number
  batasDayaAktif: boolean
}

type ElectricityLog = {
  deviceId: string
  time: string
  power: number
}

type PowerLimitForm = {
  maxWattage: string
  isActive: boolean
}

const emptyPowerLimitForm: PowerLimitForm = {
  maxWattage: "900",
  isActive: true,
}

function mapDeviceRow(item: unknown, index: number): DeviceRow {
  const relayOn = getBoolean(
    item,
    ["relay", "relayStatus", "statusRelay", "relay_status", "status_relay", "is_relay", "isRelay"],
    false
  )
  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id"], `device-${index}`),
    deviceCode: getString(item, ["deviceCode", "device_id", "kode_perangkat", "mac_address"], "-"),
    name: getString(item, ["name", "nama", "nama_perangkat"], "-"),
    houseName: getString(item, ["houseName", "nama_rumah", "rumah"], "-"),
    powerW: getNumber(item, ["powerW", "power", "daya", "daya_watt"], 0),
    relayStatus: relayOn ? "ON" : "OFF",
    batasDaya: getNumber(item, ["batas_daya", "batasDaya"], 0),
    batasDayaAktif: getBoolean(item, ["batas_daya_aktif", "batasDayaAktif"], false),
  }
}

function mapElectricityLog(item: unknown): ElectricityLog {
  return {
    deviceId: getString(item, ["deviceId", "device_id", "kode_perangkat", "mac_address"], ""),
    time: getString(item, ["time", "waktu", "waktu_baca", "created_at"], "-"),
    power: getNumber(item, ["power", "daya"], 0),
  }
}

function getReadingTimeValue(reading: ElectricityLog) {
  const parsed = new Date(reading.time).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function mergeLatestReadings(devices: DeviceRow[], readings: ElectricityLog[]) {
  const latestByDeviceId = new Map<string, ElectricityLog>()

  for (const reading of readings) {
    if (!reading.deviceId) continue
    const current = latestByDeviceId.get(reading.deviceId)
    if (!current || getReadingTimeValue(reading) >= getReadingTimeValue(current)) {
      latestByDeviceId.set(reading.deviceId, reading)
    }
  }

  return devices.map((device) => {
    const latestReading = latestByDeviceId.get(device.deviceCode)
    if (!latestReading) return device

    return {
      ...device,
      powerW: device.relayStatus === "OFF" ? 0 : latestReading.power,
    }
  })
}

export default function PengaturanDayaPage() {
  const [deviceRows, setDeviceRows] = React.useState<DeviceRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeLimits, setActiveLimits] = React.useState<Record<string, number>>({})

  const [powerLimitOpen, setPowerLimitOpen] = React.useState(false)
  const [powerLimitDevice, setPowerLimitDevice] = React.useState<DeviceRow | null>(null)
  const [powerLimitForm, setPowerLimitForm] = React.useState<PowerLimitForm>(emptyPowerLimitForm)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const loadDevices = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [devicePayload, historyPayload] = await Promise.all([
        apiRequest<unknown>("/api/perangkat"),
        apiRequest<unknown>("/api/data-listrik/history?limit=200").catch(() => null),
      ])
      
      const nextDevices = extractArray(devicePayload).map(mapDeviceRow)
      const globalReadings = extractArray(historyPayload).map(mapElectricityLog)
      
      const globalDeviceIds = new Set(globalReadings.map(r => r.deviceId).filter(Boolean))
      const missingDevices = nextDevices.filter(
        d => d.deviceCode && d.deviceCode !== "-" && !globalDeviceIds.has(d.deviceCode)
      )
      
      const perDeviceReadings = await Promise.all(
        missingDevices.map((device) =>
          apiRequest<unknown>(`/api/data-listrik/history?deviceId=${encodeURIComponent(device.deviceCode)}&limit=1`)
            .then(payload => extractArray(payload).map(mapElectricityLog))
            .catch(() => [])
        )
      )
      
      const latestReadings = [...globalReadings, ...perDeviceReadings.flat()]
      setDeviceRows(mergeLatestReadings(nextDevices, latestReadings))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data perangkat.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadDevices)
    
    // Polling setiap 5 detik agar daya terakhir tampil realtime
    const intervalId = setInterval(() => {
      void loadDevices()
    }, 5000)
    
    return () => clearInterval(intervalId)
  }, [loadDevices])

  const filteredDeviceRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return deviceRows
    return deviceRows.filter((device) =>
      [device.deviceCode, device.name, device.houseName].join(" ").toLowerCase().includes(query)
    )
  }, [deviceRows, searchQuery])

  function handleOpenPowerLimit(device: DeviceRow) {
    setPowerLimitDevice(device)
    setPowerLimitForm({
      maxWattage: device.batasDaya ? String(device.batasDaya) : "900",
      isActive: device.batasDayaAktif,
    })
    setPowerLimitOpen(true)
  }

  async function handlePowerLimitSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    if (!powerLimitDevice) return;

    setIsSubmitting(true)
    try {
      await apiRequest(`/api/perangkat/${powerLimitDevice.id}`, {
        method: "PUT",
        body: JSON.stringify({
          batas_daya: Number(powerLimitForm.maxWattage),
          batas_daya_aktif: powerLimitForm.isActive,
        }),
      })

      setActiveLimits(prev => ({
        ...prev,
        [powerLimitDevice.id]: powerLimitForm.isActive ? Number(powerLimitForm.maxWattage) : 0
      }))

      // Update local state so it reflects immediately without reload
      setDeviceRows(rows => rows.map(r => r.id === powerLimitDevice.id ? { 
        ...r, 
        batasDaya: Number(powerLimitForm.maxWattage),
        batasDayaAktif: powerLimitForm.isActive
      } : r))

      toast.success(`Batas daya untuk ${powerLimitDevice.name} berhasil disimpan.`)
      setPowerLimitOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan batas daya.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan Daya</h1>
          <p className="text-sm text-muted-foreground">
            Atur batas maksimal penggunaan daya listrik untuk proteksi perangkat otomatis mati.
          </p>
        </div>

        <Dialog open={powerLimitOpen} onOpenChange={setPowerLimitOpen}>
          <DialogContent>
            <form onSubmit={handlePowerLimitSubmit}>
              <DialogHeader>
                <DialogTitle>Atur Batas Daya: {powerLimitDevice?.name}</DialogTitle>
                <DialogDescription>
                  Proteksi otomatis mematikan perangkat jika daya melebihi batas.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Aktifkan Proteksi</Label>
                    <p className="text-xs text-muted-foreground">Matikan relay jika melewati batas.</p>
                  </div>
                  <Switch
                    checked={powerLimitForm.isActive}
                    onCheckedChange={(checked) => setPowerLimitForm(c => ({ ...c, isActive: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Batas Daya Maksimal (Watt)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      value={powerLimitForm.maxWattage}
                      onChange={(e) => setPowerLimitForm(c => ({ ...c, maxWattage: e.target.value }))}
                      className="pr-12"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">Watt</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Contoh: 900</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPowerLimitOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Batas Daya
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Daftar Perangkat</CardTitle>
            <CardDescription>Pilih perangkat yang ingin diatur batas dayanya.</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid gap-4 pb-6 md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari device ID, nama perangkat, atau rumah"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Nama Perangkat</TableHead>
                    <TableHead>Rumah</TableHead>
                    <TableHead>Daya Terakhir</TableHead>
                    <TableHead>Proteksi Aktif</TableHead>
                    <TableHead className="w-32 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredDeviceRows.length > 0 ? (
                    filteredDeviceRows.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-mono text-sm">{device.deviceCode}</TableCell>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{device.houseName}</TableCell>
                        <TableCell>{device.powerW.toLocaleString("id-ID")} W</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={device.batasDayaAktif || !!activeLimits[device.id]} 
                              disabled={isSubmitting}
                              onCheckedChange={async (checked) => {
                                if (!checked) {
                                  try {
                                    await apiRequest(`/api/perangkat/${device.id}`, {
                                      method: "PUT",
                                      body: JSON.stringify({ batas_daya_aktif: false }),
                                    })
                                    setActiveLimits(prev => ({ ...prev, [device.id]: 0 }))
                                    setDeviceRows(rows => rows.map(r => r.id === device.id ? { ...r, batasDayaAktif: false } : r))
                                    toast.success(`Proteksi batas daya ${device.name} dinonaktifkan.`)
                                  } catch (error) {
                                    toast.error("Gagal menonaktifkan proteksi.")
                                  }
                                } else {
                                  handleOpenPowerLimit(device)
                                }
                              }} 
                            />
                            {device.batasDayaAktif || activeLimits[device.id] ? (
                              <Badge variant="outline">{device.batasDaya || activeLimits[device.id]} W</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Mati</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="secondary" onClick={() => handleOpenPowerLimit(device)}>
                            <AlertTriangle className="mr-2 h-4 w-4" /> Atur
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {isLoading ? "Mengambil data..." : "Tidak ada perangkat."}
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
