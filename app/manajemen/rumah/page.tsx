"use client"

import * as React from "react"

import { SectionShell } from "@/components/section-shell"
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
  Home,
  MoreHorizontal,
  PlugZap,
  Search,
  User,
} from "lucide-react"

type HouseStatus = "Aktif" | "Perlu Setup" | "Nonaktif"

type HouseRow = {
  id: string
  name: string
  owner: string
  deviceCount: number
  status: HouseStatus
  address: string
  note?: string
}

type HouseForm = {
  name: string
  owner: string
  deviceCount: string
  status: HouseStatus
  address: string
  note: string
}

const initialHouses: HouseRow[] = [
  {
    id: "house-1",
    name: "Rumah Melati 12",
    owner: "Budi Santoso",
    deviceCount: 1,
    status: "Aktif",
    address: "Jl. Melati No. 12, Bandung",
    note: "Rumah utama pengguna.",
  },
  {
    id: "house-2",
    name: "Rumah Kenanga 07",
    owner: "Siti Aisyah",
    deviceCount: 1,
    status: "Aktif",
    address: "Jl. Kenanga No. 7, Bandung",
    note: "Perangkat sudah terhubung.",
  },
  {
    id: "house-3",
    name: "Rumah Anggrek 19",
    owner: "Andi Pratama",
    deviceCount: 0,
    status: "Perlu Setup",
    address: "Jl. Anggrek No. 19, Cimahi",
    note: "Menunggu pemasangan perangkat.",
  },
  {
    id: "house-4",
    name: "Rumah Cempaka 03",
    owner: "Maya Putri",
    deviceCount: 1,
    status: "Aktif",
    address: "Jl. Cempaka No. 3, Bandung",
    note: "Monitoring berjalan normal.",
  },
  {
    id: "house-5",
    name: "Rumah Teratai 05",
    owner: "Nadia Putri",
    deviceCount: 1,
    status: "Nonaktif",
    address: "Jl. Teratai No. 5, Bandung",
    note: "Rumah sementara dinonaktifkan.",
  },
]

const emptyForm: HouseForm = {
  name: "",
  owner: "",
  deviceCount: "0",
  status: "Aktif",
  address: "",
  note: "",
}

function getHouseBadgeVariant(status: HouseStatus) {
  switch (status) {
    case "Aktif":
      return "default"
    case "Perlu Setup":
      return "outline"
    case "Nonaktif":
      return "secondary"
    default:
      return "secondary"
  }
}

function generateId() {
  return `house-${Date.now()}`
}

export default function Page() {
  const [houseRows, setHouseRows] = React.useState<HouseRow[]>(initialHouses)
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<HouseStatus | "all">(
    "all"
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<HouseForm>(emptyForm)

  const pageSize = 5

  const activeCount = houseRows.filter(
    (house) => house.status === "Aktif"
  ).length

  const setupCount = houseRows.filter(
    (house) => house.status === "Perlu Setup"
  ).length

  const totalDeviceCount = houseRows.reduce(
    (total, house) => total + house.deviceCount,
    0
  )

  const filteredHouseRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return houseRows.filter((house) => {
      const matchesQuery =
        !query ||
        [
          house.name,
          house.owner,
          house.status,
          house.address,
          house.note ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === "all" || house.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [houseRows, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredHouseRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedHouseRows = React.useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredHouseRows.slice(startIndex, startIndex + pageSize)
  }, [filteredHouseRows, safeCurrentPage])

  const houseStats = [
    {
      label: "Total Rumah",
      value: houseRows.length,
      note: "Jumlah rumah yang terdaftar",
      icon: Home,
    },
    {
      label: "Rumah Aktif",
      value: activeCount,
      note: "Rumah yang sudah terhubung",
      icon: User,
    },
    {
      label: "Perlu Setup",
      value: setupCount,
      note: "Rumah yang belum siap dipantau",
      icon: PlugZap,
    },
    {
      label: "Total Perangkat",
      value: totalDeviceCount,
      note: "Perangkat dari seluruh rumah",
      icon: PlugZap,
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

  function handleEdit(house: HouseRow) {
    setEditingId(house.id)
    setForm({
      name: house.name,
      owner: house.owner,
      deviceCount: String(house.deviceCount),
      status: house.status,
      address: house.address,
      note: house.note ?? "",
    })
    setOpen(true)
  }

  function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus data rumah ini?"
    )

    if (!confirmDelete) return

    setHouseRows((current) => current.filter((house) => house.id !== id))
    setCurrentPage(1)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextHouse: HouseRow = {
      id: editingId ?? generateId(),
      name: form.name.trim(),
      owner: form.owner.trim(),
      deviceCount: Number(form.deviceCount),
      status: form.status,
      address: form.address.trim(),
      note: form.note.trim(),
    }

    setHouseRows((current) => {
      if (editingId) {
        return current.map((house) =>
          house.id === editingId ? nextHouse : house
        )
      }

      return [nextHouse, ...current]
    })

    setCurrentPage(1)
    resetForm()
    setOpen(false)
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Manajemen Rumah
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola data rumah pengguna yang terhubung dengan perangkat
              monitoring listrik.
            </p>
          </div>

          <Button className="w-full md:w-auto" onClick={handleAddClick}>
            Tambah Rumah
          </Button>
        </div>

        {/* Drawer Form */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <form onSubmit={handleSubmit}>
              <DrawerHeader>
                <DrawerTitle>
                  {editingId ? "Edit Rumah" : "Tambah Rumah"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingId
                    ? "Perbarui informasi rumah yang sudah terdaftar."
                    : "Tambahkan rumah baru dan hubungkan dengan pemiliknya."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid gap-4 px-4 pb-4 md:grid-cols-2 md:px-6">
                <div className="grid gap-2">
                  <Label htmlFor="house-name">Nama Rumah</Label>
                  <Input
                    id="house-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Rumah Melati 12"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="house-owner">Pemilik / User</Label>
                  <Input
                    id="house-owner"
                    value={form.owner}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        owner: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Status Rumah</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value: HouseStatus) =>
                      setForm((current) => ({
                        ...current,
                        status: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status rumah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Perlu Setup">Perlu Setup</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="device-count">Jumlah Perangkat</Label>
                  <Input
                    id="device-count"
                    type="number"
                    min={0}
                    value={form.deviceCount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deviceCount: event.target.value,
                      }))
                    }
                    placeholder="Contoh: 1"
                    required
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="house-address">Alamat</Label>
                  <Input
                    id="house-address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Jl. Melati No. 12, Bandung"
                    required
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="house-note">Catatan</Label>
                  <Textarea
                    id="house-note"
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Catatan tambahan tentang rumah ini"
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button type="submit">
                  {editingId ? "Simpan Perubahan" : "Simpan Rumah"}
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {houseStats.map((stat) => {
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
            <CardTitle>Daftar Rumah</CardTitle>
            <CardDescription>
              Data rumah yang sudah terdaftar pada sistem monitoring listrik.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Filter */}
            <div className="grid gap-4 pb-6 md:grid-cols-[1fr_220px]">
              <div className="grid gap-2">
                <Label htmlFor="house-search">Cari Rumah</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="house-search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Cari nama rumah, pemilik, alamat, atau catatan"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: HouseStatus | "all") => {
                    setStatusFilter(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Perlu Setup">Perlu Setup</SelectItem>
                    <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Rumah</TableHead>
                    <TableHead>Pemilik</TableHead>
                    <TableHead>Perangkat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedHouseRows.length > 0 ? (
                    paginatedHouseRows.map((house) => (
                      <TableRow key={house.id}>
                        <TableCell className="font-medium">
                          {house.name}
                        </TableCell>
                        <TableCell>{house.owner}</TableCell>
                        <TableCell>
                          {house.deviceCount} perangkat
                        </TableCell>
                        <TableCell>
                          <Badge variant={getHouseBadgeVariant(house.status)}>
                            {house.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {house.address}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {house.note || "-"}
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
                              <DropdownMenuItem onClick={() => handleEdit(house)}>
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(house.id)}
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
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Tidak ada data rumah yang sesuai dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {paginatedHouseRows.length} dari{" "}
                {filteredHouseRows.length} data rumah.
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