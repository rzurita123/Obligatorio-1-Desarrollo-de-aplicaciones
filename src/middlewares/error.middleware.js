const logger = require("../utils/logger");

module.exports = (err, req, res, _next) => {
  logger.error(err.message || String(err), { stack: err.stack });

  const status = Number(err.status) || 500;
  const isProd = process.env.NODE_ENV === "production";

  //El 500 está definido acá. Los otros deberian pasar un err.message. Como err siempre existe no deberia dar execption, a lo mucho null.
  res.status(status).json({
    ok: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: isProd && status >= 500 ? "Error interno del servidor" : err.message,
      details: err.details || undefined,
    },
  });
};
