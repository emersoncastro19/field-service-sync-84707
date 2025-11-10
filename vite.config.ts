import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Permite acceso desde cualquier interfaz
    port: 8080,
    open: false, // No abre automáticamente, pero muestra las URLs
    strictPort: false, // Si el puerto está ocupado, busca otro disponible
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/frontend": path.resolve(__dirname, "./src/frontend"),
      "@/backend": path.resolve(__dirname, "./src/backend"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
    },
  },
}));
