const mongoose = require("mongoose");
const { USER_ROLE_VALUES, USER_ROLES } = require("../../constants/user-role.constant");

/**
 * Usuario registrado (opcional en el flujo — join puede ser solo guest).
 * Alineado al patrón del curso: username único, contraseña para login.
 * `role`: permisos de plataforma; signup público solo crea `customer`.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, sparse: true, unique: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: USER_ROLES.CUSTOMER,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = userSchema;
