const { signUserToken } = require("../utils/jwt.util");
const { appError } = require("../utils/app-error.util");
const { sendSuccess } = require("../utils/response.util");
const { USER_ROLES } = require("../constants/user-role.constant");
const {
  findUserByUsername,
  createUser,
  comparePassword,
} = require("../services/user.service");

const postAuthSignup = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const existing = await findUserByUsername(username);
    if (existing) {
      throw appError("Nombre de usuario ya en uso", 400, "VALIDATION");
    }

    try {
      const user = await createUser({ name, username, email, password });
      return sendSuccess(res, 201, {
        message: "Usuario registrado correctamente",
        id: user._id.toString(),
        role: user.role || USER_ROLES.CUSTOMER,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw appError("Datos duplicados (username o email)", 400, "VALIDATION");
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const postAuthLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await findUserByUsername(username);

    if (!user) {
      throw appError("Credenciales inválidas", 401, "UNAUTHORIZED");
    }

    if (user.active === false) {
      throw appError("Usuario inactivo", 403, "FORBIDDEN");
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw appError("Credenciales inválidas", 401, "UNAUTHORIZED");
    }

    const token = signUserToken(user);
    const role = user.role || USER_ROLES.CUSTOMER;
    return sendSuccess(res, 200, {
      token,
      tokenType: "user",
      role,
      expiresIn: "8h",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  postAuthSignup,
  postAuthLogin,
};
