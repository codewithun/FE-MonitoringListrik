import * as React from "react"
import { Calendar, Clock, Zap, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { apiRequest } from "@/lib/api-client"
import type { Device } from "./types"

interface DeviceConfigDialogProps {
  device: Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedDevice: Device) => void
  pwaThemeStyle?: React.CSSProperties
}

export function DeviceConfigDialog({
  device,
  open,
  onOpenChange,
  onSuccess,
  pwaThemeStyle,
}: DeviceConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Scheduling State
  const [scheduleActive, setScheduleActive] = React.useState(false)
  const [scheduleDate, setScheduleDate] = React.useState("")
  const [scheduleTime, setScheduleTime] = React.useState("")
  const [scheduleAction, setScheduleAction] = React.useState<"ON" | "OFF">("ON")

  // Power Limit State
  const [powerLimitActive, setPowerLimitActive] = React.useState(false)
  const [powerLimitWatt, setPowerLimitWatt] = React.useState("900")

  // Initialize state when device changes
  React.useEffect(() => {
    if (device && open) {
      setScheduleActive(device.jadwalAktif ?? false)
      setScheduleDate(device.jadwalTanggal || new Date().toISOString().split("T")[0])
      setScheduleTime(device.jadwalWaktu || "18:00")
      setScheduleAction((device.jadwalAksi as "ON" | "OFF") || "ON")

      setPowerLimitActive(device.batasDayaAktif ?? false)
      setPowerLimitWatt(device.batasDaya ? String(device.batasDaya) : "900")
    }
  }, [device, open])

  const handleSaveSchedule = async () => {
    if (!device) return
    setIsSubmitting(true)
    try {
      await apiRequest(`/api/perangkat/${device.id}`, {
        method: "PUT",
        body: JSON.stringify({
          jadwal_aktif: scheduleActive,
          jadwal_tanggal: scheduleDate,
          jadwal_waktu: scheduleTime,
          jadwal_aksi: scheduleAction,
        }),
      })

      onSuccess({
        ...device,
        jadwalAktif: scheduleActive,
        jadwalTanggal: scheduleDate,
        jadwalWaktu: scheduleTime,
        jadwalAksi: scheduleAction,
      })
      toast.success(`Jadwal untuk ${device.name} berhasil disimpan.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan jadwal.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePowerLimit = async () => {
    if (!device) return
    setIsSubmitting(true)
    try {
      const maxWatt = Number(powerLimitWatt)
      await apiRequest(`/api/perangkat/${device.id}`, {
        method: "PUT",
        body: JSON.stringify({
          batas_daya: maxWatt,
          batas_daya_aktif: powerLimitActive,
        }),
      })

      onSuccess({
        ...device,
        batasDaya: maxWatt,
        batasDayaAktif: powerLimitActive,
      })
      toast.success(`Batas daya untuk ${device.name} berhasil disimpan.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan batas daya.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] p-4 gap-4" style={pwaThemeStyle}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            Pengaturan {device.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Konfigurasi batas daya dan jadwal untuk perangkat ini.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Jadwal</TabsTrigger>
            <TabsTrigger value="power">Batas Daya</TabsTrigger>
          </TabsList>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Aktifkan Jadwal</Label>
                <div className="text-sm text-muted-foreground">
                  Jalankan aksi pada waktu tertentu
                </div>
              </div>
              <Switch
                checked={scheduleActive}
                onCheckedChange={setScheduleActive}
              />
            </div>

            <div className={`space-y-4 ${!scheduleActive ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Waktu</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Aksi</Label>
                  <Select
                    value={scheduleAction}
                    onValueChange={(val: "ON" | "OFF") => setScheduleAction(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih aksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Hidupkan</SelectItem>
                      <SelectItem value="OFF">Matikan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSaveSchedule}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
            </Button>
          </TabsContent>

          {/* POWER LIMIT TAB */}
          <TabsContent value="power" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Aktifkan Batas Daya</Label>
                <div className="text-sm text-muted-foreground">
                  Matikan alat jika lewat batas
                </div>
              </div>
              <Switch
                checked={powerLimitActive}
                onCheckedChange={setPowerLimitActive}
              />
            </div>

            <div className={`space-y-4 ${!powerLimitActive ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="space-y-2">
                <Label>Batas Daya Maksimum (Watt)</Label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Contoh: 900"
                    value={powerLimitWatt}
                    onChange={(e) => setPowerLimitWatt(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Relay akan mati otomatis jika daya melampaui batas ini.
                </p>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSavePowerLimit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Batas Daya"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
