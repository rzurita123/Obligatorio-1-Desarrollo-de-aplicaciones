const mongoose = require("mongoose");
const { USER_ROLES } = require("../constants/user-role.constant");
const { userHasAccessToBusiness } = require("../services/business.service");
const { Table } = require("../models");

function requirePlatformUser(req, res, next) {
  if (!req.auth || req.auth.type !== "user") {
    const err = new Error("Se requiere usuario autenticado");
    err.status = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }
  next();
}

function requireEmployeeOrAdmin(req, res, next) {
  if (!req.auth || req.auth.type !== "user") {
    const err = new Error("Se requiere usuario autenticado");
    err.status = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }
  if (req.auth.role === USER_ROLES.ADMIN || req.auth.role === USER_ROLES.EMPLOYEE) {
    return next();
  }
  const err = new Error("Solo administradores o personal del negocio pueden listar negocios");
  err.status = 403;
  err.code = "FORBIDDEN";
  return next(err);
}

function resolveStaffBusinessId(req) {
  if (req.businessId && mongoose.Types.ObjectId.isValid(String(req.businessId))) {
    return String(req.businessId);
  }
  const q = req.query?.businessId;
  if (q && mongoose.Types.ObjectId.isValid(String(q))) {
    return String(q);
  }
  const b = req.body?.businessId;
  if (b && mongoose.Types.ObjectId.isValid(String(b))) {
    return String(b);
  }
  return null;
}

async function requireAdminOrStaffOfBusiness(req, res, next) {
  if (!req.auth || req.auth.type !== "user") {
    const err = new Error("Se requiere usuario autenticado (staff)");
    err.status = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }
  const businessId = resolveStaffBusinessId(req);
  if (!businessId) {
    const err = new Error(
      "businessId inválido o faltante (query en listado, body al crear, o inferido desde la mesa por id)"
    );
    err.status = 400;
    err.code = "VALIDATION";
    return next(err);
  }
  try {
    const ok = await userHasAccessToBusiness(req.auth.sub, req.auth.role, businessId);
    if (!ok) {
      const err = new Error("Sin acceso a este negocio");
      err.status = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    req.businessId = businessId;
    next();
  } catch (err) {
    next(err);
  }
}

/** Tras validar `req.params.id`, fija `req.businessId` desde la mesa (rutas staff bajo `/tables/:id`). */
async function attachBusinessIdFromTable(req, res, next) {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("id inválido");
    err.status = 400;
    err.code = "VALIDATION";
    return next(err);
  }
  try {
    const table = await Table.findById(id).select("businessId").lean();
    if (!table) {
      const err = new Error("Mesa no encontrada");
      err.status = 404;
      err.code = "NOT_FOUND";
      return next(err);
    }
    req.businessId = String(table.businessId);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requirePlatformUser,
  requireEmployeeOrAdmin,
  requireAdminOrStaffOfBusiness,
  attachBusinessIdFromTable,
};
