import * as React from "react"
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser"
import { Camera, Home, Plus, Upload, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
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

interface AddTabProps {
  houses: House[]
  user: SessionUser
  onSuccess: () => Promise<void>
  setMessage: (msg: string) => void
  initialMode?: AddMode
}

export function AddTab({
  houses,
  user,
  onSuccess,
  setMessage,
  initialMode = "device",
}: AddTabProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const barcodeImageInputRef = React.useRef<HTMLInputElement>(null)
  const scanControlsRef = React.useRef<IScannerControls | null>(null)

  const [activeMode, setActiveMode] = React.useState<AddMode>(initialMode)
  const [isBusy, setIsBusy] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
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
    setErrorMsg("")

    if (!houseName.trim()) {
      setErrorMsg("Masukkan nama rumah terlebih dahulu.")
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
      setActiveMode("device")
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Gagal menambahkan rumah."
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function addDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMsg("")

    if (!deviceCode.trim()) {
      setErrorMsg("Masukkan ID alat terlebih dahulu.")
      return
    }

    const selectedHouseForDevice = houses.find(
      (house) => house.id === selectedHouseForDeviceId
    )

    if (!selectedHouseForDevice) {
      setErrorMsg("Anda belum membuat atau memilih rumah. Tambahkan rumah terlebih dahulu.")
      setActiveMode("house")
      return
    }

    if (!isUuid(selectedHouseForDevice.id)) {
      setErrorMsg(
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
      setErrorMsg("")
      setMessage("Perangkat berhasil ditambahkan.")
      await onSuccess()
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Gagal menambahkan perangkat."
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="space-y-6 px-4 pt-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Tambah Baru</h2>
        <p className="text-muted-foreground text-sm">
          {activeMode === "house"
            ? "Tambahkan rumah terlebih dahulu sebelum menghubungkan perangkat."
            : "Pilih rumah, lalu scan barcode ID perangkat atau masukkan ID alat."}
        </p>
      </div>

      <div className="flex rounded-lg bg-muted p-1">
        <button
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            activeMode === "device"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => {
            setActiveMode("device")
            setErrorMsg("")
          }}
        >
          Perangkat
        </button>
        <button
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            activeMode === "house"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => {
            setActiveMode("house")
            setErrorMsg("")
          }}
        >
          Rumah
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-md bg-destructive/15 p-3 flex items-center gap-3 text-sm text-destructive">
          <Zap className="h-5 w-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {activeMode === "house" ? (
        <form onSubmit={addHouse} className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
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
              className="resize-none"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isBusy}>
            <Home className="mr-2 h-4 w-4" />
            Simpan Rumah
          </Button>
        </form>
      ) : (
        <form onSubmit={addDevice} className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
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
                className="shrink-0"
              >
                <Camera className="h-4 w-4" />
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
              <Upload className="mr-2 h-4 w-4" />
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
            <Plus className="mr-2 h-4 w-4" />
            Tambah Perangkat
          </Button>
        </form>
      )}
    </section>
  )
}
