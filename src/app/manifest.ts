import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cartableo",
    short_name: "Cartableo",
    description: "Personal cybersec e-learning platform",
    start_url: "/",
    display: "standalone",
    background_color: "#1f1d19",
    theme_color: "#1f1d19",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
