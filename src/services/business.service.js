const mongoose = require("mongoose");
const { Business, StaffAssignment, User } = require("../models");
const { appError } = require("../utils/app-error.util");
const { USER_ROLES } = require("../constants/user-role.constant");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function ensureBusiness(businessId) {
  if (!isValidObjectId(businessId)) {
    throw appError("businessId inválido", 400, "VALIDATION");
  }
  const business = await Business.findById(businessId);
  if (!business) {
    throw appError("Negocio no encontrado", 404, "NOT_FOUND");
  }
  return business;
}

async function ensureBusinessActive(businessId) {
  const business = await ensureBusiness(businessId);
  if (!business.active) {
    throw appError("Negocio inactivo", 403, "BUSINESS_INACTIVE");
  }
  return business;
}

async function createBusiness({ name, slug, address }) {
  const doc = await Business.create({
    name: String(name).trim(),
    slug: slug && String(slug).trim() ? String(slug).trim().toLowerCase() : undefined,
    address: address != null ? String(address).trim() : "",
    active: true,
  });
  return formatBusiness(doc);
}

function formatBusiness(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug || null,
    address: doc.address || "",
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function listBusinessesAdmin() {
  const docs = await Business.find().sort({ name: 1 }).lean();
  return docs.map((d) => formatBusiness({ ...d, _id: d._id }));
}

async function getBusinessById(businessId) {
  const business = await ensureBusiness(businessId);
  return formatBusiness(business);
}

async function updateBusiness(businessId, { name, slug, address, active }) {
  const business = await ensureBusiness(businessId);
  if (name != null) business.name = String(name).trim();
  if (slug !== undefined) {
    business.slug = slug && String(slug).trim() ? String(slug).trim().toLowerCase() : undefined;
  }
  if (address !== undefined) business.address = String(address).trim();
  if (active !== undefined) business.active = Boolean(active);
  try {
    await business.save();
  } catch (err) {
    if (err.code === 11000) {
      throw appError("Slug o nombre duplicado", 409, "DUPLICATE");
    }
    throw err;
  }
  return formatBusiness(business);
}

async function deactivateBusiness(businessId) {
  return updateBusiness(businessId, { active: false });
}

async function listBusinessesForUser(userId, role) {
  if (role === USER_ROLES.ADMIN) {
    return listBusinessesAdmin();
  }
  if (role === USER_ROLES.EMPLOYEE) {
    const links = await StaffAssignment.find({ userId }).populate("businessId").lean();
    const businesses = links.map((l) => l.businessId).filter((b) => b && b.active);
    return businesses.map((d) => formatBusiness({ ...d, _id: d._id }));
  }
  if (role === USER_ROLES.CUSTOMER) {
    return [];
  }
  throw appError("No autorizado a listar negocios", 403, "FORBIDDEN");
}

async function assignStaffToBusiness({ businessId, userId }) {
  await ensureBusiness(businessId);
  if (!isValidObjectId(userId)) {
    throw appError("userId inválido", 400, "VALIDATION");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw appError("Usuario no encontrado", 404, "NOT_FOUND");
  }
  if (user.role !== USER_ROLES.EMPLOYEE) {
    throw appError("Solo se pueden asignar usuarios con rol employee", 400, "VALIDATION");
  }

  const existingAssignment = await StaffAssignment.findOne({ userId: user._id }).lean();
  if (existingAssignment && String(existingAssignment.businessId) !== String(businessId)) {
    throw appError("Un employee solo puede estar asociado a un negocio", 409, "EMPLOYEE_ALREADY_ASSIGNED");
  }

  try {
    await StaffAssignment.create({ userId: user._id, businessId });
  } catch (err) {
    if (err.code === 11000) {
      throw appError("El usuario ya está asignado a este negocio", 409, "DUPLICATE");
    }
    throw err;
  }
  return { businessId, userId: String(userId), assigned: true };
}

async function removeStaffFromBusiness({ businessId, userId }) {
  await ensureBusiness(businessId);
  const res = await StaffAssignment.deleteOne({ businessId, userId });
  if (res.deletedCount === 0) {
    throw appError("Asignación no encontrada", 404, "NOT_FOUND");
  }
  return { businessId, userId: String(userId), removed: true };
}

async function userHasAccessToBusiness(userId, role, businessId) {
  if (role === USER_ROLES.ADMIN) return true;
  if (role !== USER_ROLES.EMPLOYEE) return false;
  if (!isValidObjectId(businessId)) return false;
  const business = await Business.findById(businessId).select("active").lean();
  if (!business || !business.active) return false;
  return StaffAssignment.exists({ userId, businessId });
}

module.exports = {
  ensureBusiness,
  ensureBusinessActive,
  createBusiness,
  listBusinessesAdmin,
  getBusinessById,
  updateBusiness,
  deactivateBusiness,
  listBusinessesForUser,
  assignStaffToBusiness,
  removeStaffFromBusiness,
  userHasAccessToBusiness,
};
