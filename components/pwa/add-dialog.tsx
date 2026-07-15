import * as React from "react"
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser"
import { Camera, Home, Plus, Upload, Zap } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { apiRequest, getValue } from "@/lib/api-client"
import type { SessionUser } from "@/lib/auth-constants"
import { mapHouse, isUuid, type House, type AddMode } from "./types"

interface AddDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  addMode: AddMode
  setAddMode: (mode: AddMode) => void
  houses: House[]
  user: SessionUser
  onSuccess: () => Promise<void>
  setMessage: (msg: string) => void
  isMissingHouseAlertOpen: boolean
  setIsMissingHouseAlertOpen: (open: boolean) => void
  pwaThemeStyle?: React.CSSProperties
}

export function AddDialog({
  isOpen,
  onOpenChange,
  addMode,
  setAddMode,
  houses,
  user,
  onSuccess,
  setMessage,
  isMissingHouseAlertOpen,
  setIsMissingHouseAlertOpen,
  pwaThemeStyle,
}: AddDialogProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const barcodeImageInputRef = React.useRef<HTMLInputElement>(null)
  const scanControlsRef = React.useRef<IScannerControls | null>(null)

  const [isBusy, setIsBusy] = React.useState(false)
  const [deviceAlertMessage, setDeviceAlertMessage] = React.useState("")
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanError, setScanError] = React.useState("")

  const [deviceCode, setDeviceCode] = React.useState("")
  const [deviceName, setDeviceName] = React.useState("")
  const [deviceLoadName, setDeviceLoadName] = React.useState("")
  const [selectedHouseForDeviceId, setSelectedHouseForDeviceId] = React.useState("")
  const [houseName, setHouseName] = React.useState("")
  const [houseAddress, setHouseAddress] = React.useState("")
  const [houseNote, setHouseNote] = React.useState("")

  React.useEffect(() => {
    if (houses.length > 0 && !selectedHouseForDeviceId) {
      setSelectedHouseForDeviceId(houses[0].id)
    }
  }, [houses, selectedHouseForDeviceId])

  React.useEffect(() => {
    if (isOpen) return
    stopBarcodeScan()
  }, [isOpen])

  React.useEffect(() => {
    return () => stopBarcodeScan()
  }, [])

  function stopBarcodeScan() {
    scanControlsRef.current?.stop()
    scanControlsRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  async function startBarcodeScan() {
    setScanError("")

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera tidak tersedia di browser ini.")
      return
    }

    const video = videoRef.current
    if (!video) return

    try {
      stopBarcodeScan()
      setIsScanning(true)

      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 250,
      })

      scanControlsRef.current = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        video,
        (result) => {
          const rawValue = result?.getText().trim()
          if (!rawValue) return
          setDeviceCode(rawValue)
          setMessage(`ID perangkat terbaca: ${rawValue}`)
          stopBarcodeScan()
        }
      )
    } catch {
      setScanError("Tidak bisa membuka kamera. Cek izin kamera untuk PWA ini.")
      stopBarcodeScan()
    }
  }

  async function scanBarcodeImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = window.URL.createObjectURL(file)

    try {
      setScanError("")
      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeFromImageUrl(imageUrl)
      const rawValue = result.getText().trim()

      if (!rawValue) {
        setScanError("Barcode tidak terbaca dari foto. Coba foto yang lebih jelas.")
        return
      }

      setDeviceCode(rawValue)
      setMessage(`ID perangkat terbaca: ${rawValue}`)
    } catch {
      setScanError("Barcode tidak terbaca dari foto. Coba foto yang lebih jelas atau ketik ID alat.")
    } finally {
      window.URL.revokeObjectURL(imageUrl)
      event.target.value = ""
    }
  }

  async function addHouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!houseName.trim()) {
      setMessage("Masukkan nama rumah terlebih dahulu.")
      return
    }

    setIsBusy(true)
    try {
      const payload = await apiRequest<unknown>("/api/rumah", {
        method: "POST",
        body: JSON.stringify({
          nama_rumah: houseName.trim(),
          alamat: houseAddress.trim(),
          deskripsi: houseNote.trim(),
          pengguna_id: user.id,
        }),
      })
      const createdHouse = mapHouse(getValue(payload, ["data"]) ?? payload, 0)

      setHouseName("")
      setHouseAddress("")
      setHouseNote("")
      setSelectedHouseForDeviceId(createdHouse.id)
      setMessage("Rumah berhasil ditambahkan. Sekarang tambahkan perangkat.")
      await onSuccess()
      setAddMode("device")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal menambahkan rumah."
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function addDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!deviceCode.trim()) {
      setDeviceAlertMessage("Masukkan ID alat terlebih dahulu.")
      return
    }

    const selectedHouseForDevice = houses.find(
      (house) => house.id === selectedHouseForDeviceId
    )

    if (!selectedHouseForDevice) {
      setMessage("")
      setIsMissingHouseAlertOpen(true)
      return
    }

    if (!isUuid(selectedHouseForDevice.id)) {
      setDeviceAlertMessage(
        "Data rumah belum memiliki ID database yang valid. Silakan tambahkan rumah baru atau pilih rumah yang valid."
      )
      return
    }

    setIsBusy(true)
    try {
      await apiRequest("/api/perangkat", {
        method: "POST",
        body: JSON.stringify({
          device_id: deviceCode.trim(),
          nama_perangkat:
            deviceName.trim() || `Perangkat ${deviceCode.trim()}`,
          nama_beban: deviceLoadName.trim() || null,
          rumah_id: selectedHouseForDevice.id,
          status: "Online",
        }),
      })
      setDeviceCode("")
      setDeviceName("")
      setDeviceLoadName("")
      setDeviceAlertMessage("")
      setMessage("Perangkat berhasil ditambahkan.")
      onOpenChange(false)
      await onSuccess()
    } catch (error) {
      setDeviceAlertMessage(
        error instanceof Error ? error.message : "Gagal menambahkan perangkat."
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          onOpenChange(open)
          if (!open) setDeviceAlertMessage("")
        }}
      >
        <DialogContent className="max-w-md" style={pwaThemeStyle}>
          <DialogHeader>
            <DialogTitle>
              {addMode === "house" ? "Tambah Rumah" : "Tambah Perangkat"}
            </DialogTitle>
            <DialogDescription>
              {addMode === "house"
                ? "Tambahkan rumah terlebih dahulu sebelum menghubungkan perangkat."
                : "Pilih rumah, lalu scan barcode ID perangkat atau masukkan ID alat secara manual."}
            </DialogDescription>
          </DialogHeader>

          {addMode === "house" ? (
            <form onSubmit={addHouse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pwa-house-name">Nama Rumah</Label>
                <Input
                  id="pwa-house-name"
                  value={houseName}
                  onChange={(event) => setHouseName(event.target.value)}
                  placeholder="Contoh: Rumah Utama"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwa-house-address">Alamat</Label>
                <Input
                  id="pwa-house-address"
                  value={houseAddress}
                  onChange={(event) => setHouseAddress(event.target.value)}
                  placeholder="Alamat rumah"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwa-house-note">Catatan</Label>
                <Textarea
                  id="pwa-house-note"
                  value={houseNote}
                  onChange={(event) => setHouseNote(event.target.value)}
                  placeholder="Catatan tambahan"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isBusy}>
                <Home />
                Simpan Rumah
              </Button>
            </form>
          ) : (
            <form onSubmit={addDevice} className="space-y-4">
              <div className="space-y-2">
                <Label>Rumah</Label>
                <Select
                  value={selectedHouseForDeviceId}
                  onValueChange={setSelectedHouseForDeviceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rumah" />
                  </SelectTrigger>
                  <SelectContent>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID Alat</Label>
                <div className="flex gap-2">
                  <Input
                    value={deviceCode}
                    onChange={(event) => setDeviceCode(event.target.value)}
                    placeholder="Scan barcode atau ketik ID alat"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Scan barcode"
                    onClick={isScanning ? stopBarcodeScan : startBarcodeScan}
                  >
                    <Camera />
                  </Button>
                </div>
                <input
                  ref={barcodeImageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={scanBarcodeImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => barcodeImageInputRef.current?.click()}
                >
                  <Upload />
                  Scan dari Foto
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Nama Perangkat</Label>
                <Input
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="Contoh: ESP32 Ruang Tamu"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Beban</Label>
                <Input
                  value={deviceLoadName}
                  onChange={(event) => setDeviceLoadName(event.target.value)}
                  placeholder="Contoh: Lampu Teras"
                />
              </div>
              <div
                className={`overflow-hidden rounded-md border bg-muted ${
                  isScanning ? "block" : "hidden"
                }`}
              >
                <video
                  ref={videoRef}
                  className="aspect-video w-full scale-x-100 object-cover"
                  muted
                  playsInline
                />
              </div>
              {scanError ? (
                <p className="text-sm text-destructive">{scanError}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isBusy}>
                <Plus />
                Tambah Perangkat
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isMissingHouseAlertOpen}
        onOpenChange={setIsMissingHouseAlertOpen}
      >
        <AlertDialogContent style={pwaThemeStyle}>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Home />
            </AlertDialogMedia>
            <AlertDialogTitle>Tambahkan rumah terlebih dahulu</AlertDialogTitle>
            <AlertDialogDescription>
              Anda belum membuat atau memilih rumah. Data alat yang sudah
              diketik akan tetap tersimpan, lalu setelah rumah dibuat perangkat
              bisa langsung ditambahkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nanti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsMissingHouseAlertOpen(false)
                setDeviceAlertMessage("")
                setAddMode("house")
                onOpenChange(true)
              }}
            >
              Tambah Rumah
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deviceAlertMessage !== ""}
        onOpenChange={(open) => {
          if (!open) setDeviceAlertMessage("")
        }}
      >
        <AlertDialogContent style={pwaThemeStyle}>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Zap />
            </AlertDialogMedia>
            <AlertDialogTitle>Perangkat belum bisa ditambahkan</AlertDialogTitle>
            <AlertDialogDescription>{deviceAlertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDeviceAlertMessage("")}>
              Mengerti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
