import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const firebaseHost =
    env.VITE_REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "ul-cd-d-931156-cs-prj.firebaseapp.com";
  const firebaseOrigin = `https://${firebaseHost}`;

  // REVERT WHEN: we no longer test SSO on `npm run dev`.
  // Temporary: local same-origin Firebase auth helper (Chrome cookie workaround).
  // Production: do NOT use this Vite proxy — reverse-proxy /__/auth on Cloud Run/nginx.
  // Keep the two path keys: /__/auth and /__/firebase → firebaseapp.com.
  const firebaseAuthProxy = {
    "/__/auth": {
      target: firebaseOrigin,
      changeOrigin: true,
      secure: true,
    },
    "/__/firebase": {
      target: firebaseOrigin,
      changeOrigin: true,
      secure: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // REVERT: delete `proxy` (and preview.proxy) with firebaseAuthProxy when local SSO stops.
      proxy: firebaseAuthProxy,
    },
    preview: {
      proxy: firebaseAuthProxy,
    },
  };
});
