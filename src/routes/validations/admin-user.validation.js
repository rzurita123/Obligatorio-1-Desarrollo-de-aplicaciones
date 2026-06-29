const Joi = require("joi");
const { objectIdSchema } = require("./tables.validation");
const { USER_ROLE_VALUES } = require("../../constants/user-role.constant");

const createAdminUserBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  username: Joi.string().trim().min(3).max(40).required(),
  email: Joi.string().email().optional().allow("", null),
  password: Joi.string().min(4).max(128).required(),
  role: Joi.string()
    .valid(...USER_ROLE_VALUES)
    .required(),
});

const patchAdminUserBodySchema = Joi.object({
  role: Joi.string()
    .valid(...USER_ROLE_VALUES)
    .required(),
});

const adminUserIdParamSchema = Joi.object({
  userId: objectIdSchema.required(),
});

module.exports = {
  createAdminUserBodySchema,
  patchAdminUserBodySchema,
  adminUserIdParamSchema,
};
