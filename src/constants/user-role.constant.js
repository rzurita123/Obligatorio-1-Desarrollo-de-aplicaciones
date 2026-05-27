/**
 * Roles de usuario de plataforma (JWT type `user`). Empleado, Administrador y Cliente.
 * Participante de mesa sigue siendo JWT type `participant` (sin role de usuario).
 * Hay que usar constant para representar enums porque no se pueden usar strings directamente en el schema de mongoose.
 */
const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  EMPLOYEE: "employee",
  ADMIN: "admin",
});

const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));

module.exports = {
  USER_ROLES,
  USER_ROLE_VALUES,
};
