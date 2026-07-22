import * as React from "react"
import { Bell, Clock, Zap, CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatTime } from "./types"

export type NotificationType = "power_limit" | "schedule" | "info" | "success"

export interface NotificationItem {
  id: string
  title: string
  description: string
  type: NotificationType
  timestamp: string // ISO string
  read: boolean
}

interface NotificationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: NotificationItem[]
  onMarkAllRead: () => void
  onClearAll: () => void
  pwaThemeStyle?: React.CSSProperties
}

export function NotificationPanel({
  open,
  onOpenChange,
  notifications,
  onMarkAllRead,
  onClearAll,
  pwaThemeStyle,
}: NotificationPanelProps) {
  React.useEffect(() => {
    if (open) {
      onMarkAllRead()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "power_limit":
        return <Zap className="h-4 w-4 text-amber-500" />
      case "schedule":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString)
      // Check if it's today
      const today = new Date()
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return `Hari ini, ${formatTime(isoString)}`
      }
      return `${date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, ${formatTime(isoString)}`
    } catch {
      return "-"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[400px] rounded-2xl p-0 overflow-hidden sm:rounded-2xl flex flex-col max-h-[80vh]" 
        style={pwaThemeStyle}
      >
        <DialogHeader className="p-4 pb-3 border-b text-left flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <DialogTitle>Notifikasi</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Daftar pemberitahuan untuk batas daya dan jadwal perangkat Anda.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
              <Bell className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Belum ada notifikasi</p>
              <p className="text-xs">Notifikasi batas daya dan penjadwalan akan muncul di sini.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`flex gap-3 p-3 rounded-xl border ${notif.read ? 'bg-card' : 'bg-muted/50 border-primary/20'}`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-none ${notif.read ? '' : 'text-primary'}`}>
                      {notif.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notif.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 pt-1">
                    {formatTimestamp(notif.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/20">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={onClearAll}
            >
              Hapus Semua
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
