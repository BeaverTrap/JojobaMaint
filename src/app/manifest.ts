import type { MetadataRoute } from "next";

// Generates /manifest.webmanifest — makes the app installable on phones.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jojoba Hills Maintenance",
    short_name: "JH Maint",
    description:
      "Logbook, team feed, and project galleries for the Jojoba Hills maintenance department.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f5",
    theme_color: "#2d6a47",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/assets/mascot.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/mascot.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/mascot.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
