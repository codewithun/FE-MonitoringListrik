export const realtimeMetrics = [
  {
    label: "Beban Saat Ini",
    value: "4.280 W",
    note: "Naik 8% dari 15 menit sebelumnya",
  },
  {
    label: "Perangkat Online",
    value: "14",
    note: "2 perangkat sedang butuh pengecekan",
  },
  {
    label: "Alert Aktif",
    value: "3",
    note: "1 alert prioritas tinggi masih terbuka",
  },
] as const

export const realtimeTrend = [
  { time: "00:00", beban: 1.8, batas: 2.8 },
  { time: "03:00", beban: 1.5, batas: 2.8 },
  { time: "06:00", beban: 2.1, batas: 3.0 },
  { time: "09:00", beban: 3.2, batas: 3.5 },
  { time: "12:00", beban: 3.9, batas: 4.1 },
  { time: "15:00", beban: 4.1, batas: 4.2 },
  { time: "18:00", beban: 4.8, batas: 4.5 },
  { time: "21:00", beban: 4.3, batas: 4.4 },
] as const

export const realtimeDevices = [
  {
    name: "Smart Meter A-01",
    rumah: "Rumah Melati 12",
    status: "Online",
    konsumsi: "1.240 W",
    update: "1 menit lalu",
  },
  {
    name: "Relay Panel Dapur",
    rumah: "Rumah Kenanga 07",
    status: "Online",
    konsumsi: "320 W",
    update: "4 menit lalu",
  },
  {
    name: "Sensor Arus Utama",
    rumah: "Rumah Anggrek 19",
    status: "Offline",
    konsumsi: "0 W",
    update: "43 menit lalu",
  },
  {
    name: "PZEM Ruang Tamu",
    rumah: "Rumah Cempaka 03",
    status: "Perlu Cek",
    konsumsi: "780 W",
    update: "12 menit lalu",
  },
  {
    name: "Smart Meter Kamar",
    rumah: "Rumah Teratai 05",
    status: "Online",
    konsumsi: "410 W",
    update: "8 menit lalu",
  },
] as const

export const realtimeAlerts = [
  {
    title: "Beban puncak mendekati batas",
    level: "Tinggi",
    detail: "Konsumsi 18:00 sudah mencapai 92% dari batas harian.",
    time: "5 menit lalu",
  },
  {
    title: "Gateway area timur offline",
    level: "Sedang",
    detail: "Koneksi terakhir diterima dari rumah Anggrek 19.",
    time: "43 menit lalu",
  },
  {
    title: "Pola konsumsi stabil",
    level: "Rendah",
    detail: "Rumah Melati 12 dan Rumah Teratai 05 berada di tren aman.",
    time: "1 jam lalu",
  },
] as const

export const historyStats = [
  {
    label: "Total Pemakaian Bulan Ini",
    value: "1.284 kWh",
    note: "Naik 6,4% dibanding bulan lalu",
  },
  {
    label: "Rata-rata Harian",
    value: "42,8 kWh",
    note: "Tertinggi terjadi pada hari Sabtu",
  },
  {
    label: "Jam Puncak",
    value: "19:00 - 21:00",
    note: "Perlu perhatian untuk pengaturan beban",
  },
] as const

export const historyMonthlyUsage = [
  { month: "Jan", usage: 980, budget: 1050 },
  { month: "Feb", usage: 1020, budget: 1050 },
  { month: "Mar", usage: 1085, budget: 1100 },
  { month: "Apr", usage: 1110, budget: 1100 },
  { month: "Mei", usage: 1240, budget: 1180 },
  { month: "Jun", usage: 1284, budget: 1200 },
] as const

export const historyDailyUsage = [
  { date: "Sen", value: 38.4 },
  { date: "Sel", value: 39.8 },
  { date: "Rab", value: 41.2 },
  { date: "Kam", value: 42.6 },
  { date: "Jum", value: 45.8 },
  { date: "Sab", value: 49.1 },
  { date: "Min", value: 44.7 },
] as const

export const predictionStats = [
  {
    label: "Prediksi 7 Hari",
    value: "47,2 kWh",
    note: "Estimasi beban harian rata-rata minggu depan",
  },
  {
    label: "Akurasi Model",
    value: "92,4%",
    note: "Berdasarkan training data 90 hari terakhir",
  },
  {
    label: "Risiko Lonjakan",
    value: "Tinggi",
    note: "Terjadi pada 2 slot waktu malam",
  },
] as const

export const predictionSeries = [
  { day: "Sen", actual: 41.1, forecast: 42.5 },
  { day: "Sel", actual: 42.3, forecast: 43.1 },
  { day: "Rab", actual: 43.6, forecast: 44.2 },
  { day: "Kam", actual: 44.9, forecast: 45.8 },
  { day: "Jum", actual: 46.7, forecast: 47.3 },
  { day: "Sab", actual: 49.2, forecast: 50.1 },
  { day: "Min", actual: 45.8, forecast: 46.4 },
] as const

export const predictionSignals = [
  {
    title: "Puncak malam hari",
    detail: "Konsumsi diproyeksikan naik pada 19:00 - 21:00 karena penggunaan AC.",
  },
  {
    title: "Beban dasar stabil",
    detail: "Jam pagi cenderung stabil, cocok untuk menyalakan beban non-esensial.",
  },
  {
    title: "Rekomendasi hemat",
    detail: "Pindahkan pemakaian pompa air ke jam siang untuk menekan puncak beban.",
  },
] as const

export const reportRows = [
  {
    period: "Juni 2026",
    actual: "1.284 kWh",
    target: "1.200 kWh",
    variance: "+7,0%",
    status: "Perlu Optimasi",
  },
  {
    period: "Mei 2026",
    actual: "1.240 kWh",
    target: "1.180 kWh",
    variance: "+5,1%",
    status: "Waspada",
  },
  {
    period: "Apr 2026",
    actual: "1.110 kWh",
    target: "1.100 kWh",
    variance: "+0,9%",
    status: "Stabil",
  },
  {
    period: "Mar 2026",
    actual: "1.085 kWh",
    target: "1.100 kWh",
    variance: "-1,4%",
    status: "Aman",
  },
] as const

export const reportCategories = [
  { label: "AC", value: 38 },
  { label: "Penerangan", value: 21 },
  { label: "Peralatan Dapur", value: 17 },
  { label: "Pompa Air", value: 14 },
  { label: "Lainnya", value: 10 },
] as const