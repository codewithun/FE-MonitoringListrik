"use client"

import * as React from "react"

import { SectionShell } from "@/components/section-shell"
import {
  apiRequest,
  extractArray,
  getBoolean,
  getString,
  getValue,
} from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"

type UserRole = "Admin" | "User"
type UserStatus = "Aktif" | "Nonaktif"

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  houseName: string
  status: UserStatus
  lastLogin: string
  note?: string
}

type UserForm = {
  name: string
  email: string
  password: string
  role: UserRole
  houseName: string
  status: UserStatus
  note: string
}

type HouseOption = {
  id: string
  name: string
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "User",
  houseName: "",
  status: "Aktif",
  note: "",
}

function getUserBadgeVariant(status: UserStatus) {
  switch (status) {
    case "Aktif":
      return "default"
    case "Nonaktif":
      return "secondary"
    default:
      return "secondary"
  }
}

function getRoleBadgeVariant(role: UserRole) {
  return role === "Admin" ? "destructive" : "secondary"
}

function mapHouseOption(item: unknown, index: number): HouseOption {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], `house-${index}`),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
  }
}

function mapUserRow(item: unknown, index: number): UserRow {
  const houses = extractArray(getValue(item, ["rumah", "houses"]))
  const role = getString(item, ["role"], "user").toLowerCase()
  const active = getBoolean(item, ["aktif", "active"], true)

  return {
    id: getString(item, ["id", "id_pengguna", "pengguna_id"], `user-${index}`),
    name: getString(item, ["name", "username", "nama", "nama_user"], "-"),
    email: getString(item, ["email"], "-"),
    role: role === "admin" ? "Admin" : "User",
    houseName: houses
      .map((house) => getString(house, ["nama_rumah", "name", "nama"]))
      .filter(Boolean)
      .join(", "),
    status: active ? "Aktif" : "Nonaktif",
    lastLogin: getString(item, ["lastLogin", "last_login", "updated_at"], "-"),
    note: getString(item, ["note", "catatan", "keterangan"]),
  }
}

export default function Page() {
  const [userRows, setUserRows] = React.useState<UserRow[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true)
  const [userError, setUserError] = React.useState("")
  const [houseOptions, setHouseOptions] = React.useState<HouseOption[]>([])
  const [houseError, setHouseError] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | "all">(
    "all"
  )
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<UserForm>(emptyForm)

  const pageSize = 5

  const loadUsers = React.useCallback(async () => {
    setIsLoadingUsers(true)
    setUserError("")

    try {
      const payload = await apiRequest<unknown>("/api/users")
      setUserRows(extractArray(payload).map(mapUserRow))
      setCurrentPage(1)
    } catch (error) {
      setUserError(
        error instanceof Error ? error.message : "Gagal mengambil data user."
      )
      setUserRows([])
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadUsers)
  }, [loadUsers])

  const loadHouseOptions = React.useCallback(async () => {
    setHouseError("")

    try {
      const payload = await apiRequest<unknown>("/api/rumah")
      setHouseOptions(extractArray(payload).map(mapHouseOption))
    } catch (error) {
      setHouseError(
        error instanceof Error ? error.message : "Gagal mengambil data rumah."
      )
      setHouseOptions([])
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadHouseOptions)
  }, [loadHouseOptions])

  const totalUsers = userRows.length
  const activeCount = userRows.filter((user) => user.status === "Aktif").length
  const inactiveCount = userRows.filter(
    (user) => user.status === "Nonaktif"
  ).length
  const adminCount = userRows.filter((user) => user.role === "Admin").length

  const filteredUserRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return userRows.filter((user) => {
      const matchesQuery =
        !query ||
        [
          user.name,
          user.email,
          user.role,
          user.houseName,
          user.status,
          user.lastLogin,
          user.note ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter

      const matchesRole = roleFilter === "all" || user.role === roleFilter

      return matchesQuery && matchesStatus && matchesRole
    })
  }, [userRows, searchQuery, statusFilter, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUserRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedUserRows = React.useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredUserRows.slice(startIndex, startIndex + pageSize)
  }, [filteredUserRows, safeCurrentPage])

  const userStats = [
    {
      label: "Total User",
      value: totalUsers,
      note: "Jumlah akun terdaftar",
      icon: Users,
    },
    {
      label: "User Aktif",
      value: activeCount,
      note: "Akun yang dapat mengakses sistem",
      icon: UserCheck,
    },
    {
      label: "User Nonaktif",
      value: inactiveCount,
      note: "Akun yang sedang dinonaktifkan",
      icon: UserCheck,
    },
    {
      label: "Admin",
      value: adminCount,
      note: "Pengelola sistem",
      icon: ShieldCheck,
    },
  ]

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function handleAddClick() {
    resetForm()
    setOpen(true)
  }

  function handleEdit(user: UserRow) {
    setEditingId(user.id)
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      houseName: user.houseName,
      status: user.status,
      note: user.note ?? "",
    })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus user ini?"
    )

    if (!confirmDelete) return

    try {
      await apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      })
      await loadUsers()
      await loadHouseOptions()
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Gagal menghapus user."
      )
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const emailAlreadyUsed = userRows.some(
      (user) => user.email === form.email.trim() && user.id !== editingId
    )

    if (emailAlreadyUsed) {
      window.alert("Email sudah digunakan oleh user lain.")
      return
    }

    if (!editingId && form.password.length < 8) {
      window.alert("Password awal minimal 8 karakter.")
      return
    }

    const nextUser: UserRow = {
      id: editingId ?? "",
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      houseName: form.houseName.trim(),
      status: form.status,
      lastLogin: "Baru saja",
      note: form.note.trim(),
    }

    const houseId =
      houseOptions.find((house) => house.name === nextUser.houseName)?.id ?? ""
    const payload = {
      username: nextUser.name,
      email: nextUser.email,
      password: form.password || undefined,
      role: nextUser.role === "Admin" ? "admin" : "user",
      aktif: nextUser.status !== "Nonaktif",
      rumah_id: houseId,
    }

    try {
      await apiRequest(editingId ? `/api/users/${editingId}` : "/api/users", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })
      await loadUsers()
      resetForm()
      setOpen(false)
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Gagal menyimpan user."
      )
    }
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Manajemen User
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola akun pengguna yang memiliki akses ke sistem monitoring
              listrik.
            </p>
          </div>

          <Button className="w-full md:w-auto" onClick={handleAddClick}>
            Tambah User
          </Button>
        </div>

        {/* Drawer Form */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <form onSubmit={handleSubmit}>
              <DrawerHeader>
                <DrawerTitle>
                  {editingId ? "Edit User" : "Tambah User"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingId
                    ? "Perbarui data akun pengguna yang sudah terdaftar."
                    : "Tambahkan akun baru dan hubungkan dengan rumah pengguna."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid gap-4 px-4 pb-4 md:grid-cols-2 md:px-6">
                <div className="grid gap-2">
                  <Label htmlFor="user-name">Nama User</Label>
                  <Input
                    id="user-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Contoh: budi@email.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        role: value as UserRole,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Status User</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        status: value as UserStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="user-password">
                    {editingId ? "Password Baru" : "Password Awal"}
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder={
                      editingId
                        ? "Kosongkan jika tidak ingin mengubah password"
                        : "Minimal 8 karakter"
                    }
                    required={!editingId}
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label>Rumah Terhubung</Label>
                  <Input
                    type="hidden"
                    name="houseName"
                    value={form.houseName}
                    readOnly
                  />
                  <Select
                    value={form.houseName || "none"}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        houseName: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rumah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak terhubung</SelectItem>
                      {houseOptions.map((house) => (
                        <SelectItem key={house.id} value={house.name}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {houseError ||
                      "Kosongkan jika akun ini adalah admin sistem."}
                  </p>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="user-note">Catatan</Label>
                  <Textarea
                    id="user-note"
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Catatan tambahan untuk user ini"
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button type="submit">
                  {editingId ? "Simpan Perubahan" : "Simpan User"}
                </Button>

                <DrawerClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>

        {/* Statistics */}
        {userError ? (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-sm text-destructive">
              {userError}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {userStats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardDescription>{stat.label}</CardDescription>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {stat.note}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Daftar User</CardTitle>
            <CardDescription>
              Data user yang dapat mengakses dashboard monitoring listrik.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Filter */}
            <div className="grid gap-4 pb-6 md:grid-cols-[1fr_180px_180px]">
              <div className="grid gap-2">
                <Label htmlFor="user-search">Cari User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Cari nama, email, role, rumah, atau status"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value as UserRole | "all")
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as UserStatus | "all")
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Rumah Terhubung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login Terakhir</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedUserRows.length > 0 ? (
                    paginatedUserRows.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>

                        <TableCell>{user.email}</TableCell>

                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {user.houseName || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getUserBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {user.lastLogin}
                        </TableCell>

                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {user.note || "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Aksi</span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {isLoadingUsers
                          ? "Mengambil data user dari server..."
                          : "Tidak ada data user yang sesuai dengan pencarian."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {paginatedUserRows.length} dari{" "}
                {filteredUserRows.length} data user.
              </p>

              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage((page) => Math.max(page - 1, 1))
                      }}
                      className={
                        safeCurrentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safeCurrentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          setCurrentPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }}
                      className={
                        safeCurrentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
