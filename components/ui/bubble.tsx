import * as React from "react"
import { cn } from "@/lib/utils"

function Bubble({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "muted" }) {
  return (
    <div
      data-slot="bubble"
      className={cn(
        "rounded-2xl px-4 py-3 max-w-full overflow-hidden wrap-break-word",
        variant === "default"
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-muted text-foreground rounded-tl-sm border",
        className
      )}
      {...props}
    />
  )
}

function BubbleContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-content"
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    />
  )
}

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function BubbleReactions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-reactions"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions }
