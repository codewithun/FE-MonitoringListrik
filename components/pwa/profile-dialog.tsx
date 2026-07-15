import * as React from "react"
import { Home, KeyRound, LogOut, Plus } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

import { logoutAction } from "@/app/actions/auth"
import { apiRequest } from "@/lib/api-client"
import type { SessionUser } from "@/lib/auth-constants"
import type { House } from "./types"

interface ProfileDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: SessionUser
  houses: House[]
  onSuccess: () => Promise<void>
  setMessage: (msg: string) => void
  onAddHouseClick: () => void
  pwaThemeStyle?: React.CSSProperties
}

export function ProfileDialog({
  isOpen,
  onOpenChange,
  user,
  houses,
  onSuccess,
  setMessage,
  onAddHouseClick,
  pwaThemeStyle,
}: ProfileDialogProps) {
  const [isBusy, setIsBusy] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  
  const [profileHouseId, setProfileHouseId] = React.useState("")
  const [profileHouseName, setProfileHouseName] = React.useState("")
  const [profileHouseAddress, setProfileHouseAddress] = React.useState("")
  const [profileHouseNote, setProfileHouseNote] = React.useState("")

  React.useEffect(() => {
    if (houses.length > 0 && !profileHouseId) {
      const house = houses[0]
      setProfileHouseId(house.id)
      setProfileHouseName(house.name)
      setProfileHouseAddress(house.address)
      setProfileHouseNote(house.note)
    }
  }, [houses, profileHouseId])

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

  async function saveProfileHouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profileHouseId) {
      setMessage("Belum ada rumah yang bisa diperbarui.")
      return
    }

    if (!profileHouseName.trim()) {
      setMessage("Nama rumah wajib diisi.")
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
      setMessage("Data rumah berhasil diperbarui.")
      await onSuccess()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal memperbarui rumah."
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" style={pwaThemeStyle}>
        <DialogHeader>
          <DialogTitle>Profil</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Avatar size="lg">
              <AvatarFallback>{avatarInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user.username}</p>
              <Badge variant={user.role === "user" ? "default" : "secondary"}>
                PWA
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input value={user.username} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Nomor Telepon</Label>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
            />
          </div>
          <div className="space-y-2">
            <Label>Ubah Sandi</Label>
            <Input
              type="password"
              placeholder="Password baru"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isBusy}>
            <KeyRound />
            Simpan Profil
          </Button>
        </form>
        <div className="border-t pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Pengaturan Rumah</p>
              <p className="text-sm text-muted-foreground">
                Ubah nama, alamat, dan catatan rumah.
              </p>
            </div>
            {houses.length === 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onAddHouseClick()
                }}
              >
                <Plus />
                Rumah
              </Button>
            ) : null}
          </div>
          {houses.length > 0 ? (
            <form onSubmit={saveProfileHouse} className="space-y-4">
              <div className="space-y-2">
                <Label>Rumah</Label>
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
                <Label htmlFor="profile-house-name">Nama Rumah</Label>
                <Input
                  id="profile-house-name"
                  value={profileHouseName}
                  onChange={(event) => setProfileHouseName(event.target.value)}
                  placeholder="Nama rumah"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-house-address">Alamat</Label>
                <Input
                  id="profile-house-address"
                  value={profileHouseAddress}
                  onChange={(event) => setProfileHouseAddress(event.target.value)}
                  placeholder="Alamat rumah"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-house-note">Catatan</Label>
                <Textarea
                  id="profile-house-note"
                  value={profileHouseNote}
                  onChange={(event) => setProfileHouseNote(event.target.value)}
                  placeholder="Catatan rumah"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isBusy}>
                <Home />
                Simpan Rumah
              </Button>
            </form>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Belum ada rumah. Tambahkan rumah agar perangkat bisa dihubungkan.
            </div>
          )}
        </div>
        <form action={logoutAction}>
          <Button variant="outline" className="w-full">
            <LogOut />
            Logout
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
