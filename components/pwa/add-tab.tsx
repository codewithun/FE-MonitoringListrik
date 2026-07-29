import * as React from "react"
import jsQR from "jsqr"
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const barcodeDetectorRef = React.useRef<unknown>(null)
  const barcodeImageInputRef = React.useRef<HTMLInputElement>(null)

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
    // Cancel animation frame loop
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // Stop all camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  function tickScan() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || video.readyState < video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(tickScan)
      return
    }

    // Gunakan BarcodeDetector API (native, cepat, sama seperti scanner HP)
    if (barcodeDetectorRef.current) {
      const detector = barcodeDetectorRef.current as { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }
      detector.detect(video).then((barcodes) => {
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const rawValue = String(barcodes[0].rawValue).trim()
          setDeviceCode(rawValue)
          setMessage(`ID perangkat terbaca: ${rawValue}`)
          stopBarcodeScan()
        } else {
          rafRef.current = requestAnimationFrame(tickScan)
        }
      }).catch(() => {
        rafRef.current = requestAnimationFrame(tickScan)
      })
      return
    }

    // Fallback: jsQR canvas-based scanner
    if (!canvas) {
      rafRef.current = requestAnimationFrame(tickScan)
      return
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tickScan)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    })

    if (code?.data) {
      const rawValue = code.data.trim()
      setDeviceCode(rawValue)
      setMessage(`ID perangkat terbaca: ${rawValue}`)
      stopBarcodeScan()
      return
    }

    rafRef.current = requestAnimationFrame(tickScan)
  }

  async function startBarcodeScan() {
    setScanError("")

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera tidak tersedia di browser ini.")
      return
    }

    const video = videoRef.current
    if (!video) return

    stopBarcodeScan()
    setIsScanning(true)

    // Try multiple constraint strategies for best device compatibility
    const constraintOptions: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: "environment" } },
      { video: true },
    ]

    let stream: MediaStream | null = null
    for (const constraints of constraintOptions) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        break
      } catch {
        // try next option
      }
    }

    if (!stream) {
      setScanError("Tidak bisa membuka kamera. Cek izin kamera untuk PWA ini.")
      setIsScanning(false)
      return
    }

    streamRef.current = stream
    video.srcObject = stream

    // Inisialisasi BarcodeDetector API jika tersedia (native, seperti scanner HP)
    if ("BarcodeDetector" in window) {
      try {
        // @ts-expect-error BarcodeDetector not in TS lib yet
        barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] })
      } catch {
        barcodeDetectorRef.current = null
      }
    } else {
      barcodeDetectorRef.current = null
    }

    // Wait for video metadata to load before starting the scan loop
    await new Promise<void>((resolve) => {
      const onReady = () => {
        video.removeEventListener("loadedmetadata", onReady)
        video.removeEventListener("playing", onReady)
        resolve()
      }
      video.addEventListener("loadedmetadata", onReady)
      video.addEventListener("playing", onReady)
    })

    await video.play().catch(() => {})

    rafRef.current = requestAnimationFrame(tickScan)
  }

  async function scanBarcodeImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setScanError("")

    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement("canvas")
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas tidak tersedia")
      ctx.drawImage(bitmap, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      })

      if (!code?.data) {
        setScanError("QR code tidak terbaca dari foto. Coba foto yang lebih jelas.")
        return
      }

      const rawValue = code.data.trim()
      setDeviceCode(rawValue)
      setMessage(`ID perangkat terbaca: ${rawValue}`)
    } catch {
      setScanError("QR code tidak terbaca dari foto. Coba foto yang lebih jelas atau ketik ID alat.")
    } finally {
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
              className="aspect-video w-full object-cover"
              muted
              autoPlay
              playsInline
            />
            {/* Hidden canvas used by jsQR to capture frames */}
            <canvas ref={canvasRef} className="hidden" />
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
