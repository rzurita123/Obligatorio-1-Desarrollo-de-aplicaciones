const logger = require("../utils/logger");

module.exports = (err, req, res, _next) => {
  logger.error(err.message || String(err), { stack: err.stack });

  const isPayloadTooLarge = err?.type === "entity.too.large" || err?.name === "PayloadTooLargeError";
  const status = Number(err.status) || (isPayloadTooLarge ? 413 : 500);
  const isProd = process.env.NODE_ENV === "production";
  const message = isPayloadTooLarge
    ? "El archivo es demasiado grande. Intenta con una imagen mas liviana."
    : err.message;
  const code = isPayloadTooLarge ? "PAYLOAD_TOO_LARGE" : err.code || "INTERNAL_ERROR";

  //El 500 está definido acá. Los otros deberian pasar un err.message. Como err siempre existe no deberia dar execption, a lo mucho null.
  res.status(status).json({
    ok: false,
    error: {
      code,
      message: isProd && status >= 500 ? "Error interno del servidor" : message,
      details: err.details || undefined,
    },
  });
};
