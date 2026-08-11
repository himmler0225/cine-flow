import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { EXTERNAL_URLS } from "@/constants/urls";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [{ path: "/", changefreq: "daily", priority: "1.0" }];

const genreSlugs = [
  "hanh-dong",
  "tinh-cam",
  "hai-huoc",
  "co-trang",
  "tam-ly",
  "hinh-su",
  "chien-tranh",
  "the-thao",
  "vo-thuat",
  "vien-tuong",
  "phieu-luu",
  "khoa-hoc",
  "kinh-di",
  "am-nhac",
  "than-thoai",
  "tai-lieu",
  "gia-dinh",
  "chinh-kich",
  "bi-an",
  "hoc-duong",
];

const countrySlugs = [
  "viet-nam",
  "trung-quoc",
  "han-quoc",
  "nhat-ban",
  "thai-lan",
  "au-my",
  "an-do",
  "anh",
  "phap",
  "hong-kong",
  "dai-loan",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const currentYear = new Date().getFullYear();

        const years: SitemapEntry[] = [];

        for (let y = currentYear; y >= currentYear - 10; y--) {
          years.push({ path: `/year/${y}`, changefreq: "weekly", priority: "0.5" });
        }

        const entries: SitemapEntry[] = [
          ...staticEntries,
          ...genreSlugs.map((s) => ({
            path: `/genre/${s}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          ...countrySlugs.map((s) => ({
            path: `/country/${s}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          ...years,
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${getSiteUrl()}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="${EXTERNAL_URLS.sitemapNamespace}">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
