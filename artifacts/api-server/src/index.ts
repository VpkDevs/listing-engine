import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"]?.trim();
const port = !rawPort ? 3001 : Number(rawPort);

if (Number.isNaN(port) || !Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

const host = process.env["HOST"]?.trim() || "0.0.0.0";

const server = app.listen(port, host, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ host, port }, "Server listening");
});

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, "Shutting down gracefully");
  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error closing HTTP server");
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
