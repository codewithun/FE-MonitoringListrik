export default function OfflinePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-center">
      <div className="max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">WattWise sedang offline</h1>
        <p className="text-sm text-muted-foreground">
          Koneksi internet belum tersedia. Buka lagi saat jaringan sudah aktif
          untuk melihat data realtime terbaru.
        </p>
      </div>
    </main>
  )
}
