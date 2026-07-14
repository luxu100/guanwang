import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_DEV_PROXY_TARGET || env.VITE_API_BASE_URL || "http://127.0.0.1:28082";

  return {
    plugins: [uni()],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          timeout: 600000,
          proxyTimeout: 600000,
        },
        "/files": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/variables.scss" as *;\n@use "@/styles/mixins.scss" as *;\n',
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
