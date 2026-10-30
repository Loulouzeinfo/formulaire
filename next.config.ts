import type { NextConfig } from "next";

// Sépare les deux bases avant de compiler les variables publiques dans le navigateur.
const devHost = "mzwkjwlxymkkeuikqeka.supabase.co";
const target = process.env.VERCEL_ENV;
if (target === "production" || target === "preview") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_")) {
    throw new Error("Configurez l’URL et la clé publique Supabase pour cet environnement Vercel.");
  }
  const host = new URL(url).hostname;
  if (target === "production" && host === devHost) {
    throw new Error("Production ne peut pas utiliser Supabase DEV. Configurez le projet Supabase PROD.");
  }
  if (target === "preview" && host !== devHost) {
    throw new Error("Preview doit utiliser uniquement le projet Supabase DEV validé.");
  }
}

const nextConfig: NextConfig = {
  /* config options here */
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

export default nextConfig;
