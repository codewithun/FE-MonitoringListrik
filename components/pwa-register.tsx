"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Download, Share } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js").catch(() => {})
      })
    }

    // Detect iOS for manual install instructions
    const isIosDevice = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    
    setIsIos(isIosDevice)

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      return // Already installed
    }

    // Android / Desktop Chrome PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Automatically show install dialog after a few seconds of browsing
      setTimeout(() => {
        const hasDismissed = localStorage.getItem("pwa_install_dismissed")
        if (!hasDismissed) {
          setShowInstallDialog(true)
        }
      }, 5000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // For iOS, optionally show the prompt after a delay if they haven't dismissed it
    if (isIosDevice) {
      setTimeout(() => {
        const hasDismissed = localStorage.getItem("pwa_install_dismissed")
        if (!hasDismissed) {
          setShowInstallDialog(true)
        }
      }, 5000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        console.log("PWA installed")
      }
      setDeferredPrompt(null)
      setShowInstallDialog(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallDialog(false)
    localStorage.setItem("pwa_install_dismissed", "true")
  }

  return (
    <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
      <DialogContent className="sm:max-w-md" onInteractOutside={handleDismiss}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Install WattWise PWA
          </DialogTitle>
          <DialogDescription>
            Install aplikasi WattWise ke perangkat Anda untuk akses yang lebih cepat, 
            pengalaman fullscreen, dan notifikasi realtime.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {isIos ? (
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <p className="font-semibold mb-2">Cara Install di iOS (iPhone/iPad):</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Ketuk ikon <strong>Share</strong> <Share className="inline h-4 w-4 mx-1" /> di bagian bawah browser Safari.</li>
                <li>Gulir ke bawah dan pilih <strong>"Add to Home Screen"</strong> atau <strong>"Tambah ke Layar Utama"</strong>.</li>
              </ol>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDismiss}>
                Nanti Saja
              </Button>
              <Button onClick={handleInstallClick}>
                Install Aplikasi
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
