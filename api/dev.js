require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");

const connectMongoDB = require("../src/models/mongo.client");
const logger = require("../src/utils/logger");

const PORT = process.env.PORT || 3000;

async function main() {
  if (process.env.MONGODB_CONNECTION_STRING) {
    try {
      await connectMongoDB();
      logger.info("MongoDB conectado");
    } catch (err) {
      logger.error("Error al conectar MongoDB", err);
      process.exit(1);
    }
  } else {
    logger.warn(
      "MONGODB_CONNECTION_STRING no definida: LA BASE NO ESTA CONECTADA."
    );
  }

  const app = require("../src/app");
  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`Servidor HTTP en http://localhost:${PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`Señal ${signal}: cerrando servidor...`);
    server.close(() => {
      mongoose.connection
        .close()
        .catch(() => {})
        .finally(() => {
          logger.info("Proceso terminado");
          process.exit(0);
        });
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
