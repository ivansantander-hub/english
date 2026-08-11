import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    // Railway (and most PaaS) proxy through a generated *.up.railway.app
    // host — allow any host so `vite preview` doesn't reject the request.
    allowedHosts: true,
  },
});
