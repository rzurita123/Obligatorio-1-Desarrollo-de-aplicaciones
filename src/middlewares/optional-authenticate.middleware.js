const { verifyTokenString } = require("../utils/jwt.util");
const config = require("../config");
const { USER_ROLES } = require("../constants/user-role.constant");
const authenticate = require("./authenticate.middleware");

/**
 * Si viene `Authorization` con JWT de **usuario**, valida y setea `req.auth`.
 * Sin header o sin Bearer → continúa sin `req.auth`.
 * Si el token es de participante → 400 (para join solo se vincula cuenta con JWT de usuario).
 */
function optionalAuthenticate(req, res, next) {
  if (!config.auth.secret) {
    return next();
  }
  const token = authenticate.extractBearer(req);
  if (!token) {
    return next();
  }
  try {
    const payload = verifyTokenString(token);
    if (payload.type !== "user") {
      const err = new Error(
        "Para vincular tu cuenta de usuario enviá el JWT obtenido en login (no el token de participante)"
      );
      err.status = 400;
      err.code = "VALIDATION";
      return next(err);
    }
    req.auth = {
      type: payload.type,
      sub: payload.sub,
      username: payload.username || null,
      role: payload.role || USER_ROLES.CUSTOMER,
      tableId: null,
      participantId: null,
      userId: String(payload.sub),
    };
    next();
  } catch (e) {
    const err = new Error("Token inválido o expirado");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    next(err);
  }
}

module.exports = optionalAuthenticate;
