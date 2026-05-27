/**
 * Autorización por rol de usuario (`req.auth.role`).
 * No aplica a tokens de participante; usá `authenticate` + `requireUserRoles` en la cadena.
 */

const { USER_ROLES } = require("../constants/user-role.constant");

function requireUserRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth || req.auth.type !== "user") {
      const err = new Error("Se requiere usuario autenticado");
      err.status = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    const role = req.auth.role;
    if (allowedRoles.length && !allowedRoles.includes(role)) {
      const err = new Error("No tenés permisos para esta operación");
      err.status = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  return requireUserRoles(USER_ROLES.ADMIN)(req, res, next);
}

module.exports = {
  requireUserRoles,
  requireAdmin,
};
