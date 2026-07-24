"use client"

import * as React from "react"
import { toast } from "sonner"
import { Clock, Search } from "lucide-react"

import { SectionShell } from "@/components/section-shell"
import { apiRequest, extractArray, getBoolean, getNumber, getString } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DeviceRow = {
  id: string
  deviceCode: string
  name: string
  houseName: string
  jadwalAktif: boolean
  jadwalWaktu: string
  jadwalTanggal: string
  jadwalAksi: string
}

type ScheduleForm = {
  date: string
  time: string
  action: "ON" | "OFF"
  isActive: boolean
}

const emptyScheduleForm: ScheduleForm = {
  date: new Date().toISOString().split("T")[0],
  time: "18:00",
  action: "ON",
  isActive: true,
}

function mapDeviceRow(item: unknown, index: number): DeviceRow {
  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id"], `device-${index}`),
    deviceCode: getString(item, ["deviceCode", "device_id", "kode_perangkat", "mac_address"], "-"),
    name: getString(item, ["name", "nama", "nama_perangkat"], "-"),
    houseName: getString(item, ["houseName", "nama_rumah", "rumah"], "-"),
    jadwalAktif: getBoolean(item, ["jadwal_aktif", "jadwalAktif"], false),
    jadwalWaktu: getString(item, ["jadwal_waktu", "jadwalWaktu"]),
    jadwalTanggal: getString(item, ["jadwal_tanggal", "jadwalTanggal"]),
    jadwalAksi: getString(item, ["jadwal_aksi", "jadwalAksi"], "ON"),
  }
}

function formatDateId(dateStr: string) {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-")
  if (!y || !m || !d) return dateStr
  
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(dateObj)
}

export default function PenjadwalanPage() {
  const [deviceRows, setDeviceRows] = React.useState<DeviceRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  const [scheduleOpen, setScheduleOpen] = React.useState(false)
  const [scheduleDevice, setScheduleDevice] = React.useState<DeviceRow | null>(null)
  const [scheduleForm, setScheduleForm] = React.useState<ScheduleForm>(emptyScheduleForm)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const loadDevices = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await apiRequest<unknown>("/api/perangkat")
      setDeviceRows(extractArray(payload).map(mapDeviceRow))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data perangkat.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadDevices)
    
    // Polling setiap 5 detik agar jadwal diperbarui otomatis
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

  function handleOpenSchedule(device: DeviceRow, forceActive?: boolean) {
    setScheduleDevice(device)
    setScheduleForm({
      date: device.jadwalTanggal || new Date().toISOString().split("T")[0],
      time: device.jadwalWaktu || "18:00",
      action: (device.jadwalAksi as "ON" | "OFF") || "ON",
      isActive: forceActive !== undefined ? forceActive : device.jadwalAktif,
    })
    setScheduleOpen(true)
  }

  async function handleScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    if (!scheduleDevice) return;
    
    setIsSubmitting(true)
    try {
      await apiRequest(`/api/perangkat/${scheduleDevice.id}`, {
        method: "PUT",
        body: JSON.stringify({
          jadwal_aktif: scheduleForm.isActive,
          jadwal_tanggal: scheduleForm.date,
          jadwal_waktu: scheduleForm.time,
          jadwal_aksi: scheduleForm.action,
        }),
      })

      setDeviceRows(rows => rows.map(r => r.id === scheduleDevice.id ? {
        ...r,
        jadwalAktif: scheduleForm.isActive,
        jadwalTanggal: scheduleForm.date,
        jadwalWaktu: scheduleForm.time,
        jadwalAksi: scheduleForm.action,
      } : r))

      toast.success(`Jadwal untuk ${scheduleDevice.name} berhasil disimpan.`)
      setScheduleOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan jadwal.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Penjadwalan Otomatis</h1>
          <p className="text-sm text-muted-foreground">
            Atur waktu kapan perangkat akan menyala atau mati secara otomatis.
          </p>
        </div>

        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent>
            <form onSubmit={handleScheduleSubmit}>
              <DialogHeader>
                <DialogTitle>Atur Jadwal: {scheduleDevice?.name}</DialogTitle>
                <DialogDescription>
                  Atur waktu kapan perangkat ini akan menyala atau mati secara otomatis.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Aktifkan Jadwal</Label>
                    <p className="text-xs text-muted-foreground">Jadwal akan berjalan jika diaktifkan.</p>
                  </div>
                  <Switch
                    checked={scheduleForm.isActive}
                    onCheckedChange={(checked) => setScheduleForm(c => ({ ...c, isActive: checked }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm(c => ({ ...c, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu</Label>
                    <Input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm(c => ({ ...c, time: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Aksi</Label>
                    <Select
                      value={scheduleForm.action}
                      onValueChange={(val) => setScheduleForm(c => ({ ...c, action: val as "ON" | "OFF" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih aksi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ON">Nyala (ON)</SelectItem>
                        <SelectItem value="OFF">Mati (OFF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Jadwal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Daftar Perangkat</CardTitle>
            <CardDescription>Pilih perangkat yang ingin diatur jadwalnya.</CardDescription>
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
                    <TableHead>Jadwal Aktif</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={device.jadwalAktif} 
                              disabled={isSubmitting}
                              onCheckedChange={async (checked) => {
                                if (!checked) {
                                  try {
                                    await apiRequest(`/api/perangkat/${device.id}`, {
                                      method: "PUT",
                                      body: JSON.stringify({ jadwal_aktif: false }),
                                    })
                                    setDeviceRows(rows => rows.map(r => r.id === device.id ? { ...r, jadwalAktif: false } : r))
                                    toast.success(`Jadwal otomatis ${device.name} dinonaktifkan.`)
                                  } catch (error) {
                                    toast.error("Gagal menonaktifkan jadwal.")
                                  }
                                } else {
                                  handleOpenSchedule(device, true)
                                }
                              }} 
                            />
                            {device.jadwalTanggal && device.jadwalWaktu ? (
                              <Badge variant={device.jadwalAktif ? "outline" : "secondary"} className={!device.jadwalAktif ? "opacity-50" : ""}>
                                {`${formatDateId(device.jadwalTanggal)} ${device.jadwalWaktu} ➔ ${device.jadwalAksi}`}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Belum diatur</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="secondary" onClick={() => handleOpenSchedule(device)}>
                            <Clock className="mr-2 h-4 w-4" /> Atur
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
