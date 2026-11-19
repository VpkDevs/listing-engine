import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Replit sets PORT and BASE_PATH in its environment; outside Replit (local
// dev, CI, Vercel, Netlify, Docker) fall back to sane defaults instead of
// refusing to build. Values that ARE set are still validated strictly.
const rawPort = process.env.PORT?.trim();
const port = !rawPort ? 5173 : Number(rawPort);

if (Number.isNaN(port) || !Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const rawBasePath = process.env.BASE_PATH?.trim();
const basePath = rawBasePath ? rawBasePath : "/";

// Replit Vite plugins are strictly opt-in for Replit dev environments only.
// Production builds and non-Replit hosts (Vercel, Netlify, Docker, local dev)
// never load or require any @replit/* plugin.
const isReplitDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

async function loadReplitDevPlugins(): Promise<PluginOption[]> {
  if (!isReplitDev) return [];
  const [runtimeErrorOverlay, cartographer, devBanner] = await Promise.all([
    import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
    import("@replit/vite-plugin-cartographer").then((m) =>
      m.cartographer({
        root: path.resolve(import.meta.dirname, ".."),
      }),
    ),
    import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
  ]);
  return [runtimeErrorOverlay, cartographer, devBanner];
}

const replitPlugins = await loadReplitDevPlugins();

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
