import * as React from "react"
import { cn } from "@/lib/utils"

function Marker({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="marker"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function MarkerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="marker-content"
      className={className}
      {...props}
    />
  )
}

export { Marker, MarkerContent }
