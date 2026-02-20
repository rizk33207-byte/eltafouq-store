import type { MetadataRoute } from "next";
import { getMockBookIds } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eltafouk.example.com";

const withBaseUrl = (path: string): string => `${BASE_URL}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const bookIds = getMockBookIds();

  const staticRoutes = [
    "/ar",
    "/en",
    "/ar/books",
    "/en/books",
    "/ar/cart",
    "/en/cart",
    "/ar/checkout",
    "/en/checkout",
    "/ar/track",
    "/en/track",
  ];

  const productRoutes = bookIds.flatMap((id) => [
    `/ar/product/${id}`,
    `/en/product/${id}`,
  ]);

  return [...staticRoutes, ...productRoutes].map((path) => ({
    url: withBaseUrl(path),
    lastModified: now,
    changeFrequency: "weekly",
    priority: path.includes("/product/") ? 0.7 : 0.8,
  }));
}
