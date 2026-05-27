const { verifyTokenString } = require("../utils/jwt.util");
const config = require("../config");
const { USER_ROLES } = require("../constants/user-role.constant");

/**
 * Lee `Authorization: <token>` o `Authorization: Bearer <token>` (común en clientes).
 * Carga `req.auth` con tipo user | participant y claims del JWT.
 * Usuarios incluyen `role` (customer | employee | admin); participantes no.
 */
function extractBearer(req) {
  const raw = req.headers.authorization || req.headers.Authorization;
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const t = raw.trim();
  if (t.startsWith("Bearer ")) {
    return t.slice(7).trim();
  }
  return t;
}

function authenticate(req, res, next) {
  if (!config.auth.secret) {
    const err = new Error("AUTH_SECRET_KEY no configurada");
    err.status = 500;
    err.code = "CONFIG";
    return next(err);
  }

  const token = extractBearer(req);
  if (!token) {
    const err = new Error("Token requerido (header Authorization)");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    return next(err);
  }

  try {
    const payload = verifyTokenString(token);
    req.auth = {
      type: payload.type,
      sub: payload.sub,
      username: payload.username || null,
      role: payload.type === "user" ? payload.role || USER_ROLES.CUSTOMER : null,
      tableId: payload.tableId || null,
      participantId: payload.participantId || null,
      userId:
        payload.type === "user"
          ? payload.sub
          : payload.userId != null
            ? String(payload.userId)
            : null,
    };
    next();
  } catch (e) {
    const err = new Error("Token inválido o expirado");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    return next(err);
  }
}

authenticate.extractBearer = extractBearer;

module.exports = authenticate;
