import type { NextConfig } from "next";
import { withIntlayer } from "next-intlayer/server";
import { defaultLocale } from "./src/lib/locale";

const nextConfig: NextConfig = {
  async redirects() {
    return ["/", "/login"].map((source) => ({
      source,
      destination: `/${defaultLocale}/login`,
      permanent: false,
    }));
  },
  async rewrites() {
    return [
      {
        source: "/email",
        has: [{ type: "query", key: "locale", value: "en" }],
        destination: "/en/email",
      },
      { source: "/email", destination: `/${defaultLocale}/email` },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withIntlayer(nextConfig);
