"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Banknote,
  Calculator,
  MoreHorizontal,
  ReceiptText,
  Search,
  Zap,
} from "lucide-react"

import { SectionShell } from "@/components/section-shell"
import {
  apiRequest,
  extractArray,
  getNumber,
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

type TariffStatus = "Aktif" | "Nonaktif"

type TariffRow = {
  id: string
  houseId: string
  houseName: string
  deviceCount: number
  onlineDeviceCount: number
  relayOnCount: number
  name: string
  pricePerKwh: number
  status: TariffStatus
  note?: string
}

type TariffForm = {
  houseId: string
  name: string
  pricePerKwh: string
  status: TariffStatus
  note: string
}

type HouseOption = {
  id: string
  name: string
  deviceCount: number
  onlineDeviceCount: number
  relayOnCount: number
}

const storageKey = "wattwise:tarif-listrik"

const defaultTariffs: TariffRow[] = [
  {
    id: "tarif-default-1",
    houseId: "",
    houseName: "Belum dipilih",
    deviceCount: 0,
    onlineDeviceCount: 0,
    relayOnCount: 0,
    name: "Tarif Rumah Tangga",
    pricePerKwh: 1352,
    status: "Aktif",
    note: "Tarif awal untuk simulasi prediksi.",
  },
  {
    id: "tarif-default-2",
    houseId: "",
    houseName: "Belum dipilih",
    deviceCount: 0,
    onlineDeviceCount: 0,
    relayOnCount: 0,
    name: "Tarif Rumah Tangga 1.300 VA",
    pricePerKwh: 1444.7,
    status: "Nonaktif",
    note: "Contoh tarif cadangan.",
  },
]

const emptyForm: TariffForm = {
  houseId: "",
  name: "",
  pricePerKwh: "",
  status: "Aktif",
  note: "",
}

function getTariffBadgeVariant(status: TariffStatus) {
  return status === "Aktif" ? "default" : "secondary"
}

function normalizeStatus(value: string): TariffStatus {
  return value.toLowerCase() === "nonaktif" ? "Nonaktif" : "Aktif"
}

function formatCurrency(value: number) {
  const normalizedValue = Number.isFinite(value) ? value : 0
  const [integerPart, decimalPart = "00"] = normalizedValue
    .toFixed(2)
    .split(".")
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `Rp ${formattedInteger},${decimalPart}`
}

function mapTariffRow(item: unknown, index: number): TariffRow {
  return {
    id: getString(item, ["id", "id_tarif", "tarif_id"], `tariff-${index}`),
    houseId: getString(item, ["houseId", "rumah_id", "id_rumah"], ""),
    houseName: getString(item, ["houseName", "nama_rumah"], "-"),
    deviceCount: getNumber(item, ["deviceCount", "jumlah_perangkat"], 0),
    onlineDeviceCount: getNumber(
      item,
      ["onlineDeviceCount", "perangkat_online"],
      0
    ),
    relayOnCount: getNumber(item, ["relayOnCount", "relay_on"], 0),
    name: getString(
      item,
      ["name", "nama", "nama_tarif", "golongan_tarif"],
      "-"
    ),
    pricePerKwh: getNumber(
      item,
      ["pricePerKwh", "harga_per_kwh", "harga_kwh", "tarif_per_kwh", "harga"],
      0
    ),
    status: normalizeStatus(
      getString(item, ["status", "status_tarif"], "Aktif")
    ),
    note: getString(item, ["note", "catatan", "keterangan", "deskripsi"]),
  }
}

function mapHouseOption(item: unknown, index: number): HouseOption {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], `house-${index}`),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
    deviceCount: getNumber(item, ["deviceCount", "jumlah_perangkat"], 0),
    onlineDeviceCount: getNumber(
      item,
      ["onlineDeviceCount", "perangkat_online"],
      0
    ),
    relayOnCount: getNumber(item, ["relayOnCount", "relay_on"], 0),
  }
}

function readLocalTariffs() {
  try {
    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) return defaultTariffs

    const parsed = JSON.parse(rawValue)
    const rows = extractArray(parsed).map(mapTariffRow)

    return rows.length > 0 ? rows : defaultTariffs
  } catch {
    return defaultTariffs
  }
}

function writeLocalTariffs(rows: TariffRow[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(rows))
}

export default function Page() {
  const [tariffRows, setTariffRows] = React.useState<TariffRow[]>([])
  const [houseOptions, setHouseOptions] = React.useState<HouseOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [isLocalMode, setIsLocalMode] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] =
    React.useState<TariffStatus | "all">("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<TariffForm>(emptyForm)

  const pageSize = 5

  const loadTariffs = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const payload = await apiRequest<unknown>("/api/tarif-listrik")
      const rows = extractArray(payload).map(mapTariffRow)
      const houses = extractArray(getValue(payload, ["rumah", "houses"])).map(
        mapHouseOption
      )
      setTariffRows(rows)
      setHouseOptions(houses)
      setIsLocalMode(false)
      setCurrentPage(1)
    } catch (error) {
      const localRows = readLocalTariffs()

      setTariffRows(localRows)
      setHouseOptions([])
      setIsLocalMode(true)
      setErrorMessage(
        error instanceof Error
          ? `${error.message} Data sementara disimpan di browser.`
          : "Endpoint tarif listrik belum tersedia. Data sementara disimpan di browser."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void Promise.resolve().then(loadTariffs)
  }, [loadTariffs])

  const activeCount = tariffRows.filter(
    (tariff) => tariff.status === "Aktif"
  ).length
  const averagePrice =
    activeCount > 0
      ? tariffRows
        .filter((tariff) => tariff.status === "Aktif")
        .reduce((total, tariff) => total + tariff.pricePerKwh, 0) /
      activeCount
      : 0
  const highestPrice = tariffRows.reduce(
    (highest, tariff) => Math.max(highest, tariff.pricePerKwh),
    0
  )

  const filteredTariffRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return tariffRows.filter((tariff) => {
      const matchesQuery =
        !query ||
        [
          tariff.name,
          tariff.houseName,
          String(tariff.pricePerKwh),
          tariff.status,
          tariff.note ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === "all" || tariff.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [tariffRows, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredTariffRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedTariffRows = React.useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredTariffRows.slice(startIndex, startIndex + pageSize)
  }, [filteredTariffRows, safeCurrentPage])

  const tariffStats = [
    {
      label: "Total Tarif",
      value: tariffRows.length,
      note: "Jumlah aturan tarif tersimpan",
      icon: ReceiptText,
    },
    {
      label: "Tarif Aktif",
      value: activeCount,
      note: "Dipakai untuk estimasi prediksi",
      icon: Zap,
    },
    {
      label: "Rata-rata Harga",
      value: formatCurrency(averagePrice),
      note: "Harga per kWh dari tarif aktif",
      icon: Calculator,
    },
    {
      label: "Harga Tertinggi",
      value: formatCurrency(highestPrice),
      note: "Tarif per kWh paling tinggi",
      icon: Banknote,
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

  function handleEdit(tariff: TariffRow) {
    setEditingId(tariff.id)
    setForm({
      name: tariff.name,
      houseId: tariff.houseId,
      pricePerKwh: String(tariff.pricePerKwh),
      status: tariff.status,
      note: tariff.note ?? "",
    })
    setOpen(true)
  }

  function saveRowsLocally(rows: TariffRow[]) {
    setTariffRows(rows)
    writeLocalTariffs(rows)
    setIsLocalMode(true)
    setCurrentPage(1)
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus tarif listrik ini?"
    )

    if (!confirmDelete) return

    if (isLocalMode) {
      saveRowsLocally(tariffRows.filter((tariff) => tariff.id !== id))
      return
    }

    try {
      await apiRequest(`/api/tarif-listrik/${id}`, {
        method: "DELETE",
      })
      await loadTariffs()
      toast.success("Berhasil menghapus tarif listrik.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus tarif listrik."
      )
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const pricePerKwh = Number(form.pricePerKwh || 0)
    const selectedHouse = houseOptions.find((house) => house.id === form.houseId)

    if (!form.houseId) {
      toast.warning("Pilih rumah terlebih dahulu.")
      return
    }

    const nextTariff: TariffRow = {
      id: editingId ?? `tarif-${Date.now()}`,
      houseId: form.houseId,
      houseName: selectedHouse?.name ?? "Belum dipilih",
      deviceCount: selectedHouse?.deviceCount ?? 0,
      onlineDeviceCount: selectedHouse?.onlineDeviceCount ?? 0,
      relayOnCount: selectedHouse?.relayOnCount ?? 0,
      name: form.name.trim(),
      pricePerKwh,
      status: form.status,
      note: form.note.trim(),
    }

    if (isLocalMode) {
      const nextRows = editingId
        ? tariffRows.map((tariff) =>
          tariff.id === editingId ? nextTariff : tariff
        )
        : [nextTariff, ...tariffRows]

      saveRowsLocally(nextRows)
      resetForm()
      setOpen(false)
      return
    }

    try {
      await apiRequest(
        editingId ? `/api/tarif-listrik/${editingId}` : "/api/tarif-listrik",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            nama_tarif: nextTariff.name,
            rumah_id: nextTariff.houseId,
            harga_per_kwh: nextTariff.pricePerKwh,
            status: nextTariff.status,
            catatan: nextTariff.note,
          }),
        }
      )
      await loadTariffs()
      resetForm()
      setOpen(false)
      toast.success(`Berhasil ${editingId ? "memperbarui" : "menambahkan"} tarif listrik.`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan tarif listrik."
      )
    }
  }

  return (
    <SectionShell>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Manajemen Tarif Listrik
            </h1>
            <p className="text-sm text-muted-foreground">
              Atur harga per kWh yang akan digunakan untuk estimasi biaya dan
              prediksi pemakaian.
            </p>
          </div>

          <Button className="w-full md:w-auto" onClick={handleAddClick}>
            Tambah Tarif
          </Button>
        </div>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <form onSubmit={handleSubmit}>
              <DrawerHeader>
                <DrawerTitle>
                  {editingId ? "Edit Tarif Listrik" : "Tambah Tarif Listrik"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingId
                    ? "Perbarui harga untuk tarif ini."
                    : "Tambahkan tarif baru untuk perhitungan prediksi."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid gap-4 px-4 pb-4 md:grid-cols-2 md:px-6">
                <div className="grid gap-2 md:col-span-2">
                  <Label>Rumah</Label>
                  <Select
                    value={form.houseId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        houseId: value,
                      }))
                    }
                    disabled={houseOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rumah untuk tarif ini" />
                    </SelectTrigger>
                    <SelectContent>
                      {houseOptions.map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.name} - {house.deviceCount} alat
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Jumlah alat rumah dipakai sebagai konteks fitur prediksi.
                  </p>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="tariff-name">Nama Tarif</Label>
                  <Input
                    id="tariff-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Rumah Tangga 1.300 VA"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price-per-kwh">Harga per kWh</Label>
                  <Input
                    id="price-per-kwh"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.pricePerKwh}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        pricePerKwh: event.target.value,
                      }))
                    }
                    placeholder="Contoh: 1444.70"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Status Tarif</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value: TariffStatus) =>
                      setForm((current) => ({
                        ...current,
                        status: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status tarif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="tariff-note">Catatan</Label>
                  <Textarea
                    id="tariff-note"
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Catatan tambahan untuk aturan tarif ini"
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button type="submit">
                  {editingId ? "Simpan Perubahan" : "Simpan Tarif"}
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

        {errorMessage ? (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-sm text-destructive">
              {errorMessage}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tariffStats.map((stat) => {
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

        <div className="grid gap-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Daftar Tarif Listrik</CardTitle>
                  <CardDescription>
                    Data harga per kWh per rumah beserta jumlah alatnya.
                  </CardDescription>
                </div>
                {isLocalMode ? (
                  <Badge variant="outline" className="w-fit">
                    Mode lokal
                  </Badge>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid gap-4 pb-6 md:grid-cols-[1fr_220px]">
                <div className="grid gap-2">
                  <Label htmlFor="tariff-search">Cari Tarif</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tariff-search"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Cari rumah, nama tarif, harga, status, atau catatan"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: TariffStatus | "all") => {
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
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tarif</TableHead>
                      <TableHead>Rumah</TableHead>
                      <TableHead>Jumlah Alat</TableHead>
                      <TableHead>Harga per kWh</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedTariffRows.length > 0 ? (
                      paginatedTariffRows.map((tariff) => (
                        <TableRow key={tariff.id}>
                          <TableCell className="font-medium">
                            {tariff.name}
                          </TableCell>
                          <TableCell>
                            {tariff.houseName}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {tariff.deviceCount} perangkat
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(tariff.pricePerKwh)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getTariffBadgeVariant(tariff.status)}
                            >
                              {tariff.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-muted-foreground">
                            {tariff.note || "-"}
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
                                <DropdownMenuItem
                                  onClick={() => handleEdit(tariff)}
                                >
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleDelete(tariff.id)}
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
                          {isLoading
                            ? "Mengambil data tarif listrik dari server..."
                            : "Tidak ada tarif listrik yang sesuai dengan pencarian."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {paginatedTariffRows.length} dari{" "}
                  {filteredTariffRows.length} data tarif.
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
      </div>
    </SectionShell>
  )
}
