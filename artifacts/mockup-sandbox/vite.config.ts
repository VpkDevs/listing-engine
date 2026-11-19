import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

// Same portability fix as flipkit-pro: default PORT/BASE_PATH outside
// Replit instead of refusing to build; set values are still validated.
const rawPort = process.env.PORT?.trim();
const port = !rawPort ? 5173 : Number(rawPort);

if (Number.isNaN(port) || !Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const rawBasePath = process.env.BASE_PATH?.trim();
const basePath = rawBasePath ? rawBasePath : "/";

const isReplitDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

async function loadReplitDevPlugins(): Promise<PluginOption[]> {
  if (!isReplitDev) return [];
  const [runtimeErrorOverlay, cartographer] = await Promise.all([
    import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
    import("@replit/vite-plugin-cartographer").then((m) =>
      m.cartographer({
        root: path.resolve(import.meta.dirname, ".."),
      }),
    ),
  ]);
  return [runtimeErrorOverlay, cartographer];
}

const replitPlugins = await loadReplitDevPlugins();

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    ...replitPlugins,
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
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
