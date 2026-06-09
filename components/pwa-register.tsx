"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration can fail in preview/dev environments; the app still works.
      })
    })
  }, [])

  return null
}
