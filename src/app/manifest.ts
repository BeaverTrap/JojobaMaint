import type { MetadataRoute } from "next";

// Generates /manifest.webmanifest — makes the app installable on phones.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JojobaWorks",
    short_name: "JojobaWorks",
    description:
      "Logbook and maintenance feed for the JojobaWorks maintenance department.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f5",
    theme_color: "#2d6a47",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/assets/logo_quail_wht.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/logo_quail_wht.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/assets/logo_quail_wht.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
