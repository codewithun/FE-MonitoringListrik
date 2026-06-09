import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WattWise Monitoring Listrik",
    short_name: "WattWise",
    description: "Aplikasi monitoring listrik realtime untuk pengguna rumah.",
    start_url: "/user",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/wattwise-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
