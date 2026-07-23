import * as React from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Edit2, Home, KeyRound, LogOut, Mail, Phone, Plus, User as UserIcon, MapPin, FileText } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { logoutAction } from "@/app/actions/auth"
import { apiRequest } from "@/lib/api-client"
import type { SessionUser } from "@/lib/auth-constants"
import type { House } from "./types"

interface ProfileTabProps {
  user: SessionUser & { nomor_telepon?: string }
  houses: House[]
  avatar: string
  setAvatar: (val: string) => void
  onSuccess: () => Promise<void>
  setMessage: (msg: string) => void
  onAddHouseClick: () => void
}

export function ProfileTab({
  user,
  houses,
  avatar,
  setAvatar,
  onSuccess,
  setMessage,
  onAddHouseClick,
}: ProfileTabProps) {
  const [isBusy, setIsBusy] = React.useState(false)
  const [activeView, setActiveView] = React.useState<"main" | "edit-account" | "edit-house">("main")
  const [phone, setPhone] = React.useState(user.nomor_telepon || "")

  const [profileHouseId, setProfileHouseId] = React.useState("")
  const [profileHouseName, setProfileHouseName] = React.useState("")
  const [profileHouseAddress, setProfileHouseAddress] = React.useState("")
  const [profileHouseNote, setProfileHouseNote] = React.useState("")

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (houses.length > 0 && !profileHouseId) {
      const house = houses[0]
      setProfileHouseId(house.id)
      setProfileHouseName(house.name)
      setProfileHouseAddress(house.address)
      setProfileHouseNote(house.note)
    }
  }, [houses, profileHouseId])

  function resetAccountState() {
    setPhone(user.nomor_telepon || "")
  }

  function resetHouseState() {
    if (houses.length > 0) {
      const house = houses.find((h) => h.id === profileHouseId) || houses[0]
      setProfileHouseId(house.id)
      setProfileHouseName(house.name)
      setProfileHouseAddress(house.address)
      setProfileHouseNote(house.note)
    }
  }

  const avatarInitials = user.username
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)

    try {
      await apiRequest(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ phone, nomor_telepon: phone }),
      })
      setMessage("Profil berhasil disimpan.")
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan profil. Pastikan backend sudah punya field nomor telepon."
      )
    } finally {
      setIsBusy(false)
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsBusy(true)
    const loadingToast = toast.loading("Sedang mengunggah foto profil...")

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = new Image()
        img.onload = async () => {
          const canvas = document.createElement("canvas")
          const MAX_WIDTH = 300
          const MAX_HEIGHT = 300
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("Canvas tidak didukung.")
          ctx.drawImage(img, 0, 0, width, height)

          const base64String = canvas.toDataURL("image/jpeg", 0.7)

          try {
            await apiRequest(`/api/users/${user.id}`, {
              method: "PUT",
              body: JSON.stringify({ avatar: base64String }),
            })


            setAvatar(base64String)
            window.localStorage.setItem(`avatar_${user.id}`, base64String)
            toast.success("Foto profil berhasil diperbarui.", { id: loadingToast })
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal mengunggah foto profil.", { id: loadingToast })
          } finally {
            setIsBusy(false)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error("Gagal membaca file gambar.", { id: loadingToast })
      setIsBusy(false)
    }
  }

  async function saveProfileHouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profileHouseId) {
      toast.warning("Belum ada rumah yang bisa diperbarui.")
      return
    }

    if (!profileHouseName.trim()) {
      toast.warning("Nama rumah wajib diisi.")
      return
    }

    setIsBusy(true)

    try {
      await apiRequest(`/api/rumah/${profileHouseId}`, {
        method: "PUT",
        body: JSON.stringify({
          nama_rumah: profileHouseName.trim(),
          alamat: profileHouseAddress.trim(),
          deskripsi: profileHouseNote.trim(),
          pengguna_id: user.id,
        }),
      })
      toast.success("Data rumah berhasil diperbarui.")
      await onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui rumah."
      )
    } finally {
      setIsBusy(false)
    }
  }

  if (activeView === "edit-account") {
    return (
      <section className="space-y-4 bg-slate-50/50 pb-4 pt-4 dark:bg-transparent animate-in slide-in-from-right-4 duration-300">
        <div className="px-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { resetAccountState(); setActiveView("main") }} className="h-8 w-8 rounded-full shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">Ubah Data Akun</h2>
        </div>
        <div className="px-4">
          <form onSubmit={saveProfile} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <UserIcon className="h-5 w-5 text-muted-foreground/70" />
                <div className="flex flex-1 flex-col min-w-0">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nama Lengkap</Label>
                  <Input
                    className="h-6 w-full border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0 shadow-none truncate"
                    value={user.username}
                    readOnly
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Mail className="h-5 w-5 text-muted-foreground/70" />
                <div className="flex flex-1 flex-col min-w-0">
                  <Label className="text-[10px] uppercase text-muted-foreground">Alamat Email</Label>
                  <Input
                    className="h-6 w-full border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0 shadow-none text-muted-foreground truncate"
                    value={user.email}
                    readOnly
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Phone className="h-5 w-5 text-muted-foreground/70" />
                <div className="flex flex-1 flex-col min-w-0">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nomor Telepon</Label>
                  <Input
                    className="h-6 w-full max-w-full border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0 shadow-none"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Masukkan nomor telepon"
                    inputMode="tel"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <KeyRound className="h-5 w-5 text-muted-foreground/70" />
                <div className="flex flex-1 flex-col min-w-0">
                  <Label className="text-[10px] uppercase text-muted-foreground">Kata Sandi</Label>
                  <PasswordInput
                    id="new-password"
                    name="password"
                    className="h-6 w-full max-w-full border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0 shadow-none"
                    placeholder="Ketik sandi baru untuk mengubah"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="bg-muted/30 px-4 py-3 border-t">
                <Button type="submit" size="sm" className="w-full rounded-xl" disabled={isBusy}>
                  Simpan Perubahan Akun
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    )
  }

  if (activeView === "edit-house") {
    return (
      <section className="space-y-4 bg-slate-50/50 pb-4 pt-4 dark:bg-transparent animate-in slide-in-from-right-4 duration-300">
        <div className="px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { resetHouseState(); setActiveView("main") }} className="h-8 w-8 rounded-full shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold tracking-tight">Pengaturan Rumah</h2>
          </div>
          {houses.length === 0 ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary px-3 rounded-full" onClick={onAddHouseClick}>
              <Plus className="mr-1 h-3 w-3" /> Tambah
            </Button>
          ) : null}
        </div>
        <div className="px-4">
          {houses.length > 0 ? (
            <form onSubmit={saveProfileHouse} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <Home className="h-5 w-5 text-muted-foreground/70" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <Label className="text-[10px] uppercase text-muted-foreground">Pilih Rumah</Label>
                    <Select
                      value={profileHouseId}
                      onValueChange={(value) => {
                        const house = houses.find((item) => item.id === value)
                        setProfileHouseId(value)
                        setProfileHouseName(house?.name ?? "")
                        setProfileHouseAddress(house?.address ?? "")
                        setProfileHouseNote(house?.note ?? "")
                      }}
                    >
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium focus:ring-0 shadow-none px-0 gap-0">
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
                </div>
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <Edit2 className="h-5 w-5 text-muted-foreground/70" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <Label className="text-[10px] uppercase text-muted-foreground">Nama Rumah</Label>
                    <Input
                      className="h-6 w-full max-w-full border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0 shadow-none"
                      value={profileHouseName}
                      onChange={(event) => setProfileHouseName(event.target.value)}
                      placeholder="Contoh: Rumah Utama"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <MapPin className="h-5 w-5 text-muted-foreground/70" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <Label className="text-[10px] uppercase text-muted-foreground">Alamat</Label>
                    <Input
                      className="min-h-[40px] w-full max-w-full border-0 bg-transparent -ml-1 px-1 py-1 text-sm font-medium focus-visible:ring-0 shadow-none resize-none break-all"
                      value={profileHouseAddress}
                      onChange={(event) => setProfileHouseAddress(event.target.value)}
                      placeholder="Masukkan alamat rumah"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3">
                  <FileText className="h-5 w-5 text-muted-foreground/70 mt-1" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <Label className="text-[10px] uppercase text-muted-foreground mb-1">Catatan</Label>
                    <Textarea
                      className="min-h-[40px] w-full max-w-full border-0 bg-transparent -ml-1 px-1 py-1 text-sm font-medium focus-visible:ring-0 shadow-none resize-none break-all"
                      value={profileHouseNote}
                      onChange={(event) => setProfileHouseNote(event.target.value)}
                      placeholder="Tambahkan catatan khusus..."
                    />
                  </div>
                </div>
                <div className="bg-muted/30 px-4 py-3 border-t">
                  <Button type="submit" size="sm" className="w-full rounded-xl" disabled={isBusy}>
                    Simpan Perubahan Rumah
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground shadow-sm">
              Belum ada rumah. Tambahkan rumah agar perangkat bisa dihubungkan.
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 bg-slate-50/50 pb-4 pt-4 dark:bg-transparent animate-in fade-in duration-500">

      {/* Header Profile */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-4 pb-2">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
            <AvatarImage src={avatar} alt={user.username} className="object-cover" />
            <AvatarFallback className="text-2xl">{avatarInitials}</AvatarFallback>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={isBusy}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-sm ring-4 ring-background hover:bg-primary/90 transition-colors"
            disabled={isBusy}
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{user.username}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* PENGATURAN AKUN */}
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pengaturan Akun
          </h3>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => setActiveView("edit-account")}
              className="flex w-full items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Ubah Data Akun</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </button>
          </div>
        </div>

        {/* PENGATURAN RUMAH */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pengaturan Rumah
            </h3>
            {houses.length === 0 ? (
              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary px-2" onClick={onAddHouseClick}>
                <Plus className="mr-1 h-3 w-3" /> Tambah
              </Button>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => setActiveView("edit-house")}
              className="flex w-full items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Kelola Data Rumah</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="pt-2">
          <form action={logoutAction}>
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white font-semibold text-base shadow-sm dark:bg-transparent dark:border-red-900/50 dark:text-red-500"
            >
              Keluar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs font-medium text-muted-foreground pb-8">
          Versi 1.0.0 (2026)
        </p>
      </div>
    </section>
  )
}
