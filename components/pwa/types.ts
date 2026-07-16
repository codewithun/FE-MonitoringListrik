import * as React from "react"
import {
  extractArray,
  getBoolean,
  getNumber,
  getString,
  getValue,
  isRecord,
} from "@/lib/api-client"
import type { SessionUser } from "@/lib/auth-constants"

export type TabKey = "home" | "prediction"
export type RelayStatus = "ON" | "OFF"
export type PwaTheme = "light" | "dark"
export type AddMode = "house" | "device"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string | React.ReactNode
}

export type House = {
  id: string
  name: string
  address: string
  note: string
}

export type Device = {
  id: string
  deviceId: string
  name: string
  houseId: string
  houseName: string
  relayStatus: RelayStatus
}

export type ElectricityLog = {
  id: string
  deviceId: string
  time: string
  voltage: number
  current: number
  power: number
  energy: number
  frequency: number
  powerFactor: number
}

export type Prediction = {
  label: string
  cost: number
  energy: number
  houseId: string
  deviceId: string
}

export function mapHouse(item: unknown, _index: number): House {
  return {
    id: getString(item, ["id", "id_rumah", "rumah_id"], ""),
    name: getString(item, ["name", "nama", "nama_rumah"], "-"),
    address: getString(item, ["address", "alamat"], ""),
    note: getString(item, ["note", "catatan", "keterangan", "deskripsi"], ""),
  }
}

export function extractRelationArray(value: unknown) {
  const rows = extractArray(value)

  if (rows.length > 0) return rows
  if (isRecord(value)) return [value]

  return []
}

export function mapUserHouse(item: unknown, _index: number): House {
  if (!isRecord(item)) {
    return {
      id: "",
      name: "-",
      address: "",
      note: "",
    }
  }

  const directHouseId = getString(item, ["rumah_id", "id_rumah", "houseId"])
  const rawDirectHouseName = getValue(item, ["nama_rumah", "houseName", "rumah"])
  const directHouseName =
    typeof rawDirectHouseName === "string" || typeof rawDirectHouseName === "number"
      ? String(rawDirectHouseName)
      : ""

  if (directHouseId || directHouseName) {
    return {
      id: directHouseId,
      name: directHouseName || "-",
      address: getString(item, ["address", "alamat"], ""),
      note: getString(item, ["note", "catatan", "keterangan", "deskripsi"], ""),
    }
  }

  return mapHouse(item, _index)
}

export function getHousesFromUserPayload(payload: unknown) {
  const source = isRecord(payload) && isRecord(payload.data) ? payload.data : payload

  if (!isRecord(source)) return []

  const nestedHouses = extractRelationArray(getValue(source, ["rumah", "houses"]))
    .map(mapUserHouse)
    .filter((house) => house.id || house.name !== "-")

  if (nestedHouses.length > 0) return nestedHouses

  const directHouseId = getString(source, ["rumah_id", "id_rumah", "houseId"])
  const rawDirectHouseName = getValue(source, ["nama_rumah", "houseName"])
  const directHouseName =
    typeof rawDirectHouseName === "string" || typeof rawDirectHouseName === "number"
      ? String(rawDirectHouseName)
      : ""

  if (!directHouseId && !directHouseName) return []

  return [
    {
      id: directHouseId,
      name: directHouseName || "-",
      address: getString(source, ["address", "alamat"], ""),
      note: getString(source, ["note", "catatan", "keterangan", "deskripsi"], ""),
    },
  ]
}

export function idsMatch(first: string, second: string) {
  return first.trim() !== "" && String(first) === String(second)
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export function houseBelongsToUser(item: unknown, user: SessionUser) {
  const ownerIds = extractRelationArray(getValue(item, ["pemilik", "owners", "users"]))
    .map((owner) => getString(owner, ["id", "id_pengguna", "pengguna_id"]))

  return (
    idsMatch(getString(item, ["user_id", "id_user", "pengguna_id"]), user.id) ||
    ownerIds.some((ownerId) => idsMatch(ownerId, user.id))
  )
}

export function mapDevice(item: unknown, index: number): Device {
  const relayOn = getBoolean(
    item,
    ["relay", "relayStatus", "statusRelay", "relay_status", "status_relay"],
    false
  )
  const nestedHouse = getValue(item, ["rumah", "house"])
  const rawHouseName = getValue(item, ["houseName", "nama_rumah", "rumah"])
  const houseName =
    typeof rawHouseName === "string" || typeof rawHouseName === "number"
      ? String(rawHouseName)
      : getString(nestedHouse, ["name", "nama", "nama_rumah"], "-")

  return {
    id: getString(item, ["id", "id_perangkat", "perangkat_id"], `device-${index}`),
    deviceId: getString(item, ["deviceId", "device_id", "kode_perangkat", "mac_address"], "-"),
    name: getString(item, ["name", "nama", "nama_perangkat", "nama_beban"], "-"),
    houseId:
      getString(item, ["houseId", "rumah_id", "id_rumah"]) ||
      getString(nestedHouse, ["id", "id_rumah", "rumah_id"], ""),
    houseName,
    relayStatus: relayOn ? "ON" : "OFF",
  }
}

export function mapElectricityLog(item: unknown, index: number): ElectricityLog {
  const rawTime = getString(
    item,
    ["time", "waktu", "waktu_baca", "created_at", "timestamp"],
    "-"
  )

  return {
    id: getString(item, ["id"], `${rawTime}-${index}`),
    deviceId: getString(item, ["deviceId", "device_id"], "-"),
    time: formatTime(rawTime),
    voltage: getNumber(item, ["voltage", "tegangan"], 0),
    current: getNumber(item, ["current", "arus"], 0),
    power: getNumber(item, ["power", "daya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh"], 0),
    frequency: getNumber(item, ["frequency", "frekuensi"], 0),
    powerFactor: getNumber(item, ["powerFactor", "power_factor", "pf", "faktor_daya"], 0),
  }
}

export function mapPrediction(item: unknown, index: number): Prediction {
  const bulan = getNumber(item, ["bulan"], 0)
  const tahun = getNumber(item, ["tahun"], 0)

  let label = `Prediksi ${index + 1}`
  if (bulan > 0 && tahun > 0) {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]
    label = `${monthNames[bulan - 1]} ${tahun}`
  } else {
    label = getString(item, ["label", "periode"], label)
  }

  return {
    label,
    cost: getNumber(item, ["cost", "biaya", "prediksi_biaya"], 0),
    energy: getNumber(item, ["energy", "energi", "kwh", "prediksi_kwh", "prediksi_energi_kwh"], 0),
    houseId: getString(item, ["houseId", "rumah_id", "id_rumah"], ""),
    deviceId: getString(item, ["deviceId", "device_id", "id_perangkat", "perangkat_id"], ""),
  }
}

export function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function isTabKey(value: string | null): value is TabKey {
  return value === "home" || value === "prediction"
}

export function getTabFromUrl() {
  if (typeof window === "undefined") return "home"

  const tab = new URLSearchParams(window.location.search).get("tab")
  return isTabKey(tab) ? tab : "home"
}
