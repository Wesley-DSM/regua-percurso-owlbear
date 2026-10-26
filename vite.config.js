import { defineConfig } from "vite";

const allowedOrigins = new Set([
  "https://www.owlbear.rodeo",
  "https://owlbear.rodeo",
]);

function owlbearLocalCors() {
  return {
    name: "owlbear-local-cors",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && allowedOrigins.has(origin)) {
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Vary", "Origin");
          res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "Content-Type");
          res.setHeader("Access-Control-Allow-Private-Network", "true");
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: "/regua-percurso-owlbear/",
  publicDir: "public",
  plugins: [owlbearLocalCors()],
  server: {
    host: "0.0.0.0",
    // CORS headers are set by owlbearLocalCors() so normal requests and
    // private-network preflight requests receive the same allow-list.
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        settings: "settings.html",
      },
    },
  },
});
