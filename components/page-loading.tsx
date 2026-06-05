import { SpinnerCustom } from "@/components/ui/spinner"

export function PageLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center p-6">
      <SpinnerCustom />
    </div>
  )
}
