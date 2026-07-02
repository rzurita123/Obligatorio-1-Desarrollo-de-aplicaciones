const bcrypt = require("bcryptjs");
const { User, StaffAssignment } = require("../models");
const { USER_ROLES } = require("../constants/user-role.constant");
const { appError } = require("../utils/app-error.util");

async function countAdmins(excludeUserId = null) {
  const filter = { role: USER_ROLES.ADMIN, active: { $ne: false } };
  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }
  return User.countDocuments(filter);
}

async function createUserByAdmin({ name, username, email, password, role }) {
  const existing = await User.findOne({ username: username.trim() });
  if (existing) {
    throw appError("Nombre de usuario ya en uso", 400, "VALIDATION");
  }

  const hashed = await bcrypt.hash(password, 10);
  try {
    const doc = new User({
      name: name.trim(),
      username: username.trim(),
      email: email && String(email).trim() ? String(email).trim() : undefined,
      password: hashed,
      active: true,
      role,
    });
    await doc.save();
    return {
      id: doc._id.toString(),
      name: doc.name,
      username: doc.username,
      email: doc.email || null,
      role: doc.role,
      active: doc.active,
    };
  } catch (err) {
    if (err.code === 11000) {
      throw appError("Datos duplicados (username o email)", 400, "VALIDATION");
    }
    throw err;
  }
}

async function updateUserRole(userId, role, requestingUserId) {
  const user = await User.findById(userId);
  if (!user) {
    throw appError("Usuario no encontrado", 404, "NOT_FOUND");
  }

  if (String(user._id) === String(requestingUserId) && role !== USER_ROLES.ADMIN) {
    const otherAdmins = await countAdmins(user._id);
    if (otherAdmins === 0) {
      throw appError("No podés degradarte: sos el único administrador", 403, "FORBIDDEN");
    }
  }

  if (user.role === USER_ROLES.ADMIN && role !== USER_ROLES.ADMIN) {
    const otherAdmins = await countAdmins(user._id);
    if (otherAdmins === 0) {
      throw appError("No se puede quitar el rol admin al único administrador", 403, "FORBIDDEN");
    }
  }

  user.role = role;
  await user.save();

  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
  };
}

async function listEmployeesByAdmin() {
  const employees = await User.find({ role: USER_ROLES.EMPLOYEE })
    .select("_id name username email active role")
    .sort({ createdAt: -1 })
    .lean();

  if (!employees.length) {
    return [];
  }

  const employeeIds = employees.map((employee) => employee._id);

  const assignments = await StaffAssignment.find({ userId: { $in: employeeIds } })
    .populate("businessId", "name slug")
    .lean();

  const businessesByUserId = new Map();

  assignments.forEach((assignment) => {
    const userId = String(assignment.userId);
    const business = assignment.businessId;

    if (!business || !business._id) {
      return;
    }

    if (!businessesByUserId.has(userId)) {
      businessesByUserId.set(userId, []);
    }

    businessesByUserId.get(userId).push({
      id: business._id.toString(),
      name: business.name,
      slug: business.slug,
    });
  });

  return employees.map((employee) => ({
    id: employee._id.toString(),
    name: employee.name,
    username: employee.username,
    email: employee.email || null,
    role: employee.role,
    active: employee.active,
    businesses: businessesByUserId.get(employee._id.toString()) || [],
  }));
}

module.exports = {
  createUserByAdmin,
  updateUserRole,
  listEmployeesByAdmin,
};
