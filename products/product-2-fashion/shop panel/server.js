const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");

// ── Standalone or regular mode ──────────────────────────────────────────────
// When built with `output: 'standalone'`, Next.js produces a self-contained
// server at `.next/standalone/server.js`. We detect that and use it.
// Otherwise we fall back to `require("next")` for the regular approach.

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

let app, handle;

// Try standalone first (production build output)
const standalonePath = path.join(__dirname, ".next", "standalone", "server.js");

try {
  // Check if standalone build exists
  require("fs").accessSync(standalonePath);

  // If standalone exists, just start it directly
  // The standalone server.js is self-contained
  console.log("> Starting Next.js in standalone mode...");
  process.env.PORT = String(port);
  process.env.HOSTNAME = hostname;
  require(standalonePath);
} catch {
  // Fall back to regular Next.js server (development or non-standalone builds)
  const next = require("next");
  app = next({ dev, hostname, port });
  handle = app.getRequestHandler();

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err);
  });

  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
  });

  app.prepare().then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  });
}