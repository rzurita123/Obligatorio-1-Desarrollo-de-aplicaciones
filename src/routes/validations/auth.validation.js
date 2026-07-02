const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  username: Joi.string().min(3).max(40).required(),
  email: Joi.string().email().optional().allow("", null),
  password: Joi.string().min(4).max(128).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(40).required(),
  password: Joi.string().min(1).max(128).required(),
});

const businessInterestSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  contact: Joi.string().trim().min(3).max(240).required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  businessInterestSchema,
};
