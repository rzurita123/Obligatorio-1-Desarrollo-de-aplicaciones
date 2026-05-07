const cors = require("cors");

//CORS controlado vía CORS_ORIGIN. (TODO: validar si quedo andnado)

function resolveOrigin() {
  const raw = (process.env.CORS_ORIGIN || "").trim();
  const nodeEnv = process.env.NODE_ENV || "development";

  if (!raw || raw === "*") {
    if (nodeEnv === "production") {
      return false;
    }
    return true;
  }

  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) {
    return nodeEnv === "production" ? false : true;
  }
  if (list.length === 1) {
    return list[0];
  }
  return list;
}

module.exports = cors({
  origin: resolveOrigin(),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  credentials: false,
});
