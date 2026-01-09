import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-i18next"],
          "tanstack-vendor": ["@tanstack/react-query", "@tanstack/react-router"],
          "ui-vendor": ["lucide-react", "sonner", "class-variance-authority", "clsx", "tailwind-merge"],
          "db-vendor": ["@supabase/supabase-js", "drizzle-orm", "postgres"],
          "ai-vendor": ["replicate"],
          "canvas-vendor": ["react-sketch-canvas"],
          "analytics-vendor": ["react-ga4", "react-microsoft-clarity"],
          "utils-vendor": ["axios", "i18next", "i18next-browser-languagedetector"],
        },
      },
    },
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**", ".idea/**", ".git/**", ".cache/**"],
  },
});
