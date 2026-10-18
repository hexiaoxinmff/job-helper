import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

const PUBLIC_ROUTES = [
  "/",
  "/editor",
  "/preview",
  "/interview",
  "/star",
  "/tracker",
  "/profile",
  "/vertical",
  "/campus",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.5,
  }));
}
