const Joi = require("joi");
const { objectIdSchema } = require("./tables.validation");

const createBusinessBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().min(2).max(80).lowercase().optional().allow(null, ""),
  address: Joi.string().trim().max(240).optional().allow(""),
});

const updateBusinessBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  slug: Joi.string().trim().min(2).max(80).lowercase().optional().allow(null, ""),
  address: Joi.string().trim().max(240).optional().allow(""),
  active: Joi.boolean().optional(),
}).min(1);

const adminBusinessIdParamSchema = Joi.object({
  businessId: objectIdSchema.required(),
});

const assignStaffBodySchema = Joi.object({
  userId: objectIdSchema.required(),
});

const adminBusinessStaffUserParamSchema = Joi.object({
  businessId: objectIdSchema.required(),
  userId: objectIdSchema.required(),
});

module.exports = {
  createBusinessBodySchema,
  updateBusinessBodySchema,
  adminBusinessIdParamSchema,
  assignStaffBodySchema,
  adminBusinessStaffUserParamSchema,
};
