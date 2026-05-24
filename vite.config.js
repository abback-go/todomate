import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project Pages serve under /todomate/ ; local dev stays at /.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/todomate/" : "/",
  plugins: [react()],
  server: { port: 5173, open: false },
}));
