/**
 * Autorización MesaPay: token de participante y coincidencia con `tableId` de la ruta o del body.
 */

function requireParticipant(req, res, next) {
  if (!req.auth || req.auth.type !== "participant") {
    const err = new Error("Se requiere token de participante de mesa (join)");
    err.status = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }
  next();
}

/** `req.params[param]` debe ser el mismo `tableId` del JWT. */
function requireParticipantTableParam(param = "id") {
  return (req, res, next) => {
    const routeTableId = req.params[param];
    if (!routeTableId || String(routeTableId) !== String(req.auth.tableId)) {
      const err = new Error("El token no corresponde a esta mesa");
      err.status = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    next();
  };
}

/** POST con `tableId` en body (ej. /items, /payments). */
function requireBodyTableIdMatchesParticipant(req, res, next) {
  const bodyTid = req.body?.tableId;
  if (!bodyTid) {
    const err = new Error("tableId es requerido en el body");
    err.status = 400;
    err.code = "VALIDATION";
    return next(err);
  }
  if (String(bodyTid) !== String(req.auth.tableId)) {
    const err = new Error("tableId no coincide con el token de participante");
    err.status = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }
  next();
}

module.exports = {
  requireParticipant,
  requireParticipantTableParam,
  requireBodyTableIdMatchesParticipant,
};
