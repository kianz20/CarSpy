import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CarSpy",
    short_name: "CarSpy",
    description: "Find the best used-car deals across NZ dealer inventory",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b14",
    theme_color: "#6d5bff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
