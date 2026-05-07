const mongoose = require("mongoose");

/**
 * Usuario registrado (opcional en el flujo — join puede ser solo guest).
 * Alineado al patrón del curso: username único, contraseña para login.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, sparse: true, unique: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = userSchema;
